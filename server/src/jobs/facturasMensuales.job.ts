import type { UsuarioActivoRow } from '../types/db.types';
import { pool } from '../config/database';
import * as notificacionesRepository from '../modules/notificaciones/notificaciones.repository';

const TIPO_NOTIFICACION = 'FACTURAS_MENSUALES';
const DIA_AVISO = 10;
const DIA_LIMITE = 17;
const INTERVALO_REVISION_MS = 60 * 60 * 1000;
const DIAS_RESTANTES_NO_APLICA = 0;
const EMPRESA_ARDUM_ID = 1;

interface OrigenFacturas {
  tabla: string;
  titulo: string;
  nombre: string;
  ruta: string;
}

const ORIGENES: OrigenFacturas[] = [
  {
    tabla: 'facturas',
    titulo: 'Facturas ARDUM del mes',
    nombre: 'Facturas ARDUM',
    ruta: `/empresas/${EMPRESA_ARDUM_ID}/documentos/facturas`,
  },
  {
    tabla: 'facturas_hl',
    titulo: 'Facturas HL del mes',
    nombre: 'Facturas HL',
    ruta: '/hl/facturas',
  },
];

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

export async function revisarFacturasMensuales(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const hoy = new Date();
    const dia = hoy.getDate();
    if (dia < DIA_AVISO || dia > DIA_LIMITE) return;

    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    const periodoId = anio * 100 + mes;
    const nombreMes = hoy.toLocaleDateString('es-MX', { month: 'long' });
    const usuariosIds = await findUsuariosActivos();

    for (const origen of ORIGENES) {
      const cuerpo = `${origen.nombre} de ${nombreMes} ${anio}: registra las facturas del mes a más tardar el ${DIA_LIMITE} de ${nombreMes}.`;

      for (const usuarioId of usuariosIds) {
        const yaExiste = await notificacionesRepository.existeParaOrigenDia(origen.tabla, periodoId, usuarioId, DIAS_RESTANTES_NO_APLICA);
        if (yaExiste) continue;

        await notificacionesRepository.crear({
          usuarioId,
          tipo: TIPO_NOTIFICACION,
          origenTabla: origen.tabla,
          origenId: periodoId,
          diasRestantes: DIAS_RESTANTES_NO_APLICA,
          titulo: origen.titulo,
          cuerpo,
          ruta: origen.ruta,
        });
      }
    }
  } catch (error) {
    console.error('Error al revisar facturas mensuales:', error);
  } finally {
    ejecutando = false;
  }
}

export function iniciarJobFacturasMensuales(): void {
  void revisarFacturasMensuales();
  setInterval(() => { void revisarFacturasMensuales(); }, INTERVALO_REVISION_MS);
}
