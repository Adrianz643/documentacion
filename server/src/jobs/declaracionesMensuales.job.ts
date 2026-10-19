import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import type { UsuarioActivoRow } from '../types/db.types';
import * as notificacionesRepository from '../modules/notificaciones/notificaciones.repository';

const TIPO_NOTIFICACION = 'DECLARACIONES_MENSUALES';
const ORIGEN_TABLA = 'declaraciones';
const EMPRESA_ARDUM_ID = 1;
const INTERVALO_REVISION_MS = 60 * 60 * 1000;
const DIAS_RESTANTES_NO_APLICA = 0;

interface PendientesRow extends RowDataPacket {
  total: number;
}

async function contarPropietariosSinDeclaracion(mes: number, anio: number): Promise<number> {
  const [rows] = await pool.execute<PendientesRow[]>(
    `SELECT COUNT(*) AS total
     FROM propietarios p
     WHERE p.empresa_id = ? AND p.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM declaraciones d
         WHERE d.propietario_id = p.id AND d.deleted_at IS NULL
           AND d.periodo_mes = ? AND d.periodo_anio = ?
       )`,
    [EMPRESA_ARDUM_ID, mes, anio],
  );
  return Number(rows[0]?.total ?? 0);
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

let ejecutando = false;

export async function revisarDeclaracionesMensuales(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    const periodoId = anio * 100 + mes;

    const pendientes = await contarPropietariosSinDeclaracion(mes, anio);
    if (pendientes === 0) return;

    const usuariosIds = await findUsuariosActivos();
    const nombreMes = hoy.toLocaleDateString('es-MX', { month: 'long' });
    const titulo = 'Declaraciones del mes';
    const cuerpo = `Declaraciones de ${nombreMes} ${anio}: ${pendientes} propietario${pendientes === 1 ? '' : 's'} sin declaración registrada.`;
    const ruta = `/empresas/${EMPRESA_ARDUM_ID}/documentos/declaraciones`;

    for (const usuarioId of usuariosIds) {
      const yaExiste = await notificacionesRepository.existeParaOrigenDia(ORIGEN_TABLA, periodoId, usuarioId, DIAS_RESTANTES_NO_APLICA);
      if (yaExiste) continue;

      await notificacionesRepository.crear({
        usuarioId,
        tipo: TIPO_NOTIFICACION,
        origenTabla: ORIGEN_TABLA,
        origenId: periodoId,
        diasRestantes: DIAS_RESTANTES_NO_APLICA,
        titulo,
        cuerpo,
        ruta,
      });
    }
  } catch (error) {
    console.error('Error al revisar declaraciones mensuales:', error);
  } finally {
    ejecutando = false;
  }
}

export function iniciarJobDeclaracionesMensuales(): void {
  void revisarDeclaracionesMensuales();
  setInterval(() => { void revisarDeclaracionesMensuales(); }, INTERVALO_REVISION_MS);
}
