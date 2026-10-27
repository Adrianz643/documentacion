import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import type { UsuarioActivoRow } from '../types/db.types';
import * as notificacionesRepository from '../modules/notificaciones/notificaciones.repository';
import * as configuracionRepository from '../modules/configuracion/configuracion.repository';

const TIPO_NOTIFICACION = 'FACTURA_VENCIMIENTO';
const UMBRAL_REPETICION_DIA_CERO_SEGUNDOS = 5 * 60;
const INTERVALO_REVISION_MS = 60 * 1000;

interface FacturaPorVencerRow extends RowDataPacket {
  id: number;
  etiqueta: string;
  empresa_id: number | null;
  dias_restantes: number;
}

interface OrigenFactura {
  tabla: string;
  titulo: string;
  etiquetaSingular: string;
  ruta: (row: FacturaPorVencerRow) => string;
  consulta: string;
}

const ORIGENES: OrigenFactura[] = [
  {
    tabla: 'facturas',
    titulo: 'Factura por vencer',
    etiquetaSingular: 'La factura de',
    ruta: (row) => `/empresas/${row.empresa_id}/documentos/facturas/${row.id}`,
    consulta: `SELECT f.id, p.nombre AS etiqueta, p.empresa_id,
                      DATEDIFF(f.fecha_vencimiento, CURDATE()) AS dias_restantes
               FROM facturas f
               INNER JOIN propietarios p ON p.id = f.propietario_id
               WHERE f.deleted_at IS NULL AND p.deleted_at IS NULL
                 AND f.fecha_vencimiento IS NOT NULL
                 AND DATEDIFF(f.fecha_vencimiento, CURDATE()) BETWEEN 0 AND ?`,
  },
  {
    tabla: 'facturas_hl',
    titulo: 'Factura HL por vencer',
    etiquetaSingular: 'La factura HL de',
    ruta: (row) => `/hl/facturas/${row.id}`,
    consulta: `SELECT f.id, f.cliente AS etiqueta, NULL AS empresa_id,
                      DATEDIFF(f.fecha_vencimiento, CURDATE()) AS dias_restantes
               FROM facturas_hl f
               WHERE f.deleted_at IS NULL
                 AND f.fecha_vencimiento IS NOT NULL
                 AND DATEDIFF(f.fecha_vencimiento, CURDATE()) BETWEEN 0 AND ?`,
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

function construirCuerpo(origen: OrigenFactura, row: FacturaPorVencerRow): string {
  const { dias_restantes: dias, etiqueta } = row;
  return dias === 0
    ? `${origen.etiquetaSingular} ${etiqueta} vence hoy.`
    : `${origen.etiquetaSingular} ${etiqueta} vence en ${dias} día${dias === 1 ? '' : 's'}.`;
}

async function procesarFactura(origen: OrigenFactura, row: FacturaPorVencerRow, usuariosIds: number[]): Promise<void> {
  const cuerpo = construirCuerpo(origen, row);
  const ruta = origen.ruta(row);

  for (const usuarioId of usuariosIds) {
    if (row.dias_restantes > 0) {
      const yaExiste = await notificacionesRepository.existeParaOrigenDia(origen.tabla, row.id, usuarioId, row.dias_restantes);
      if (yaExiste) continue;
    } else {
      const segundos = await notificacionesRepository.segundosDesdeUltimaParaOrigen(origen.tabla, row.id, usuarioId, 0);
      if (segundos !== null && segundos < UMBRAL_REPETICION_DIA_CERO_SEGUNDOS) continue;
    }

    await notificacionesRepository.crear({
      usuarioId,
      tipo: TIPO_NOTIFICACION,
      origenTabla: origen.tabla,
      origenId: row.id,
      diasRestantes: row.dias_restantes,
      titulo: origen.titulo,
      cuerpo,
      ruta,
    });
  }
}

let ejecutando = false;

export async function revisarVencimientosFacturas(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const diasAnticipacion = await configuracionRepository.findAlertaFielDiasAnticipacion();
    const usuariosIds = await findUsuariosActivos();
    if (usuariosIds.length === 0) return;

    for (const origen of ORIGENES) {
      const [rows] = await pool.execute<FacturaPorVencerRow[]>(origen.consulta, [diasAnticipacion]);
      for (const row of rows) {
        await procesarFactura(origen, row, usuariosIds);
      }
    }
  } catch (error) {
    console.error('Error al revisar vencimientos de facturas:', error);
  } finally {
    ejecutando = false;
  }
}

export function iniciarJobFacturasVencimiento(): void {
  void revisarVencimientosFacturas();
  setInterval(() => { void revisarVencimientosFacturas(); }, INTERVALO_REVISION_MS);
}
