import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';

export interface DocumentoRecienteRawRow extends RowDataPacket {
  id: number;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  ruta_storage: string;
  empresa_id: number;
  created_at: Date;
  subido_por_nombre: string | null;
  subido_por_rol: string | null;
  dp_id: number | null;
  dcl_id: number | null;
  f_id: number | null;
  fr_id: number | null;
  ec_id: number | null;
}

const LIMITE_RECIENTES = 5;

export async function contarDocumentosTotales(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM documentos WHERE deleted_at IS NULL`,
  );
  return Number(rows[0]?.total ?? 0);
}

export async function findRecientes(soloUsuarioId?: number): Promise<DocumentoRecienteRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND d.subido_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<DocumentoRecienteRawRow[]>(
    `SELECT
       d.id, d.nombre_archivo, d.mime_type, d.tamano_bytes, d.ruta_storage, d.empresa_id, d.created_at,
       CONCAT(p.nombre, ' ', p.apellido_paterno) AS subido_por_nombre,
       r.nombre AS subido_por_rol,
       COALESCE(dp.id, dp2.id) AS dp_id,
       dcl.id AS dcl_id,
       f.id AS f_id,
       fr.id AS fr_id,
       ecr.empresa_china_id AS ec_id
     FROM documentos d
     JOIN usuarios u ON u.id = d.subido_por
     JOIN personas p ON p.id = u.persona_id
     JOIN roles r ON r.id = u.rol_id
     LEFT JOIN documentos_personales dp
       ON d.id IN (dp.contrato_ardum_id, dp.contrato_hegewisch_id, dp.csf_id, dp.acuse_cita_id)
     LEFT JOIN valores_columnas_personalizadas vcp ON vcp.valor_documento_id = d.id
     LEFT JOIN documentos_personales dp2 ON dp2.propietario_id = vcp.propietario_id
     LEFT JOIN declaraciones dcl ON dcl.comprobante_id = d.id
     LEFT JOIN facturas f ON f.comprobante_id = d.id
     LEFT JOIN fiel_registros fr
       ON d.id IN (fr.clave_privada_id, fr.certificado_id)
     LEFT JOIN empresa_china_requisitos ecr ON ecr.documento_id = d.id
     WHERE d.deleted_at IS NULL ${filtro}
     ORDER BY d.created_at DESC
     LIMIT ${LIMITE_RECIENTES}`,
    params,
  );
  return rows;
}
