import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';

export interface ValorColumnaRow extends RowDataPacket {
  columna_id: number;
  registro_id: number;
  valor_texto: string | null;
  valor_documento_id: number | null;
  doc_tipo_id: number | null;
  doc_nombre: string | null;
  doc_ruta: string | null;
  doc_mime: string | null;
  doc_tam: number | null;
  doc_subido_por: number | null;
  doc_creado: Date | null;
}

interface ExistenciaRow extends RowDataPacket {
  existe: number;
}

interface TipoDocumentoIdRow extends RowDataPacket {
  id: number;
}

interface ValorActualRow extends RowDataPacket {
  valor_documento_id: number | null;
}

const TABLA_POR_SECCION: Record<string, string> = {
  facturas: 'facturas',
  facturas_hl: 'facturas_hl',
  declaraciones: 'declaraciones',
  declaraciones_cero: 'declaraciones',
};

const SELECT_VALOR = `
  SELECT
    v.columna_id,
    v.registro_id,
    v.valor_texto,
    v.valor_documento_id,
    d.tipo_documento_id AS doc_tipo_id,
    d.nombre_archivo    AS doc_nombre,
    d.ruta_storage      AS doc_ruta,
    d.mime_type         AS doc_mime,
    d.tamano_bytes      AS doc_tam,
    d.subido_por        AS doc_subido_por,
    d.created_at        AS doc_creado
  FROM valores_columnas_registro v
  INNER JOIN columnas_personalizadas c ON c.id = v.columna_id AND c.deleted_at IS NULL
  LEFT JOIN documentos d ON d.id = v.valor_documento_id AND d.deleted_at IS NULL
`;

export function seccionSoportada(seccion: string): boolean {
  return seccion in TABLA_POR_SECCION;
}

export async function findPorEmpresaSeccion(empresaId: number, seccion: string): Promise<ValorColumnaRow[]> {
  const [rows] = await pool.execute<ValorColumnaRow[]>(
    `${SELECT_VALOR} WHERE c.empresa_id = ? AND c.seccion = ?`,
    [empresaId, seccion],
  );
  return rows;
}

export async function findUno(columnaId: number, registroId: number): Promise<ValorColumnaRow | null> {
  const [rows] = await pool.execute<ValorColumnaRow[]>(
    `${SELECT_VALOR} WHERE v.columna_id = ? AND v.registro_id = ? LIMIT 1`,
    [columnaId, registroId],
  );
  return rows[0] ?? null;
}

export async function existeRegistro(seccion: string, registroId: number): Promise<boolean> {
  const tabla = TABLA_POR_SECCION[seccion];
  if (!tabla) return false;
  const [rows] = await pool.execute<ExistenciaRow[]>(
    `SELECT 1 AS existe FROM ${tabla} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [registroId],
  );
  return rows.length > 0;
}

export async function findTipoDocumentoIdByClave(clave: string): Promise<number | null> {
  const [rows] = await pool.execute<TipoDocumentoIdRow[]>(
    `SELECT id FROM tipos_documento WHERE clave = ? AND activo = 1 LIMIT 1`,
    [clave],
  );
  return rows[0]?.id ?? null;
}

export async function upsertTexto(columnaId: number, registroId: number, valor: string, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO valores_columnas_registro (columna_id, registro_id, valor_texto, creado_por, modificado_por)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE valor_texto = VALUES(valor_texto), modificado_por = VALUES(modificado_por)`,
    [columnaId, registroId, valor, actorId, actorId],
  );
}

async function marcarDocumentoBorrado(connection: PoolConnection, documentoId: number | null, actorId: number): Promise<void> {
  if (!documentoId) return;
  await connection.execute<ResultSetHeader>(
    `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, documentoId],
  );
}

export async function upsertDocumento(
  columnaId: number,
  registroId: number,
  documentoId: number,
  actorId: number,
): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [actualRows] = await connection.execute<ValorActualRow[]>(
      `SELECT valor_documento_id FROM valores_columnas_registro
       WHERE columna_id = ? AND registro_id = ? FOR UPDATE`,
      [columnaId, registroId],
    );
    const anteriorId = actualRows[0]?.valor_documento_id ?? null;

    await connection.execute<ResultSetHeader>(
      `INSERT INTO valores_columnas_registro (columna_id, registro_id, valor_documento_id, creado_por, modificado_por)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE valor_documento_id = VALUES(valor_documento_id), modificado_por = VALUES(modificado_por)`,
      [columnaId, registroId, documentoId, actorId, actorId],
    );
    await marcarDocumentoBorrado(connection, anteriorId === documentoId ? null : anteriorId, actorId);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function eliminarValor(columnaId: number, registroId: number, actorId: number): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [actualRows] = await connection.execute<ValorActualRow[]>(
      `SELECT valor_documento_id FROM valores_columnas_registro
       WHERE columna_id = ? AND registro_id = ? FOR UPDATE`,
      [columnaId, registroId],
    );
    await marcarDocumentoBorrado(connection, actualRows[0]?.valor_documento_id ?? null, actorId);
    await connection.execute<ResultSetHeader>(
      `DELETE FROM valores_columnas_registro WHERE columna_id = ? AND registro_id = ?`,
      [columnaId, registroId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
