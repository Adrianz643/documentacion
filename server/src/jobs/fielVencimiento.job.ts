import { pool } from '../config/database';
import type { FielPorVencerRow, UsuarioActivoRow } from '../types/db.types';
import * as notificacionesRepository from '../modules/notificaciones/notificaciones.repository';
import * as configuracionRepository from '../modules/configuracion/configuracion.repository';

const TIPO_NOTIFICACION = 'FIEL_VENCIMIENTO';
const ORIGEN_TABLA = 'fiel_registros';
const UMBRAL_REPETICION_DIA_CERO_SEGUNDOS = 5 * 60;
const INTERVALO_REVISION_MS = 60 * 1000;

async function findFielPorVencer(diasAnticipacion: number): Promise<FielPorVencerRow[]> {
  const [rows] = await pool.execute<FielPorVencerRow[]>(
    `SELECT
       fr.id AS fiel_id,
       p.id AS propietario_id,
       p.nombre AS propietario_nombre,
       p.empresa_id,
       DATEDIFF(fr.fecha_vencimiento, CURDATE()) AS dias_restantes
     FROM fiel_registros fr
     INNER JOIN propietarios p ON p.id = fr.propietario_id
     WHERE fr.deleted_at IS NULL AND p.deleted_at IS NULL
       AND fr.fecha_vencimiento IS NOT NULL
       AND DATEDIFF(fr.fecha_vencimiento, CURDATE()) BETWEEN 0 AND ?`,
    [diasAnticipacion],
  );
  return rows;
}

async function findUsuariosActivos(): Promise<number[]> {
  const [rows] = await pool.execute<UsuarioActivoRow[]>(
    `SELECT u.id
     FROM usuarios u
     INNER JOIN cat_estados_usuario e ON e.id = u.estado_id
     WHERE u.deleted_at IS NULL AND e.clave = 'ACTIVO'`,
  );
  return rows.map((row) => row.id);
}

function construirMensaje(diasRestantes: number, propietarioNombre: string): { titulo: string; cuerpo: string } {
  const titulo = 'FIEL por vencer';
  const cuerpo = diasRestantes === 0
    ? `La FIEL de ${propietarioNombre} vence hoy.`
    : `La FIEL de ${propietarioNombre} vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}.`;
  return { titulo, cuerpo };
}

async function procesarFielPorVencer(registro: FielPorVencerRow, usuariosIds: number[]): Promise<void> {
  const { fiel_id: fielId, propietario_nombre: propietarioNombre, empresa_id: empresaId, dias_restantes: diasRestantes } = registro;
  const ruta = `/empresas/${empresaId}/documentos/fiel/${fielId}`;
  const { titulo, cuerpo } = construirMensaje(diasRestantes, propietarioNombre);

  for (const usuarioId of usuariosIds) {
    if (diasRestantes > 0) {
      const yaExiste = await notificacionesRepository.existeParaOrigenDia(ORIGEN_TABLA, fielId, usuarioId, diasRestantes);
      if (yaExiste) continue;
    } else {
      const segundos = await notificacionesRepository.segundosDesdeUltimaParaOrigen(ORIGEN_TABLA, fielId, usuarioId, 0);
      if (segundos !== null && segundos < UMBRAL_REPETICION_DIA_CERO_SEGUNDOS) continue;
    }

    await notificacionesRepository.crear({
      usuarioId,
      tipo: TIPO_NOTIFICACION,
      origenTabla: ORIGEN_TABLA,
      origenId: fielId,
      diasRestantes,
      titulo,
      cuerpo,
      ruta,
    });
  }
}

let ejecutando = false;

export async function revisarVencimientosFiel(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const diasAnticipacion = await configuracionRepository.findAlertaFielDiasAnticipacion();
    const [registros, usuariosIds] = await Promise.all([findFielPorVencer(diasAnticipacion), findUsuariosActivos()]);
    if (registros.length === 0 || usuariosIds.length === 0) return;

    for (const registro of registros) {
      await procesarFielPorVencer(registro, usuariosIds);
    }
  } catch (error) {
    console.error('Error al revisar vencimientos de FIEL:', error);
  } finally {
    ejecutando = false;
  }
}

export function iniciarJobFielVencimiento(): void {
  void revisarVencimientosFiel();
  setInterval(() => { void revisarVencimientosFiel(); }, INTERVALO_REVISION_MS);
}
