import type { UsuarioActivoRow } from '../types/db.types';
import { pool } from '../config/database';
import * as notificacionesRepository from '../modules/notificaciones/notificaciones.repository';

const TIPO_NOTIFICACION = 'DECLARACIONES_MENSUALES';
const ORIGEN_TABLA = 'declaraciones';
const EMPRESA_ARDUM_ID = 1;
const DIA_AVISO = 10;
const DIA_LIMITE = 17;
const INTERVALO_REVISION_MS = 60 * 60 * 1000;
const DIAS_RESTANTES_NO_APLICA = 0;

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
    const dia = hoy.getDate();
    if (dia < DIA_AVISO || dia > DIA_LIMITE) return;

    const anio = hoy.getFullYear();
    const periodoId = anio * 100 + (hoy.getMonth() + 1);
    const nombreMes = hoy.toLocaleDateString('es-MX', { month: 'long' });
    const titulo = 'Declaraciones del mes';
    const cuerpo = `Declaraciones de ${nombreMes} ${anio}: presenta las declaraciones del mes a más tardar el ${DIA_LIMITE} de ${nombreMes}.`;
    const ruta = `/empresas/${EMPRESA_ARDUM_ID}/documentos/declaraciones`;

    const usuariosIds = await findUsuariosActivos();
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
