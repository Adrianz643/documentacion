import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { DocumentoPersonalRow } from '../../types/db.types';
import type { CampoDocumentoPersonal, PropietarioInput } from './documentos-personales.types';

interface RutaStorageRow extends RowDataPacket {
  ruta_storage: string;
}

interface SlotActualRow extends RowDataPacket {
  actual_id: number | null;
}

interface TipoDocumentoIdRow extends RowDataPacket {
  id: number;
}

export const CAMPO_COLUMNA: Record<CampoDocumentoPersonal, string> = {
  contratoArdum: 'contrato_ardum_id',
  contratoHegewisch: 'contrato_hegewisch_id',
  csf: 'csf_id',
  acuseCita: 'acuse_cita_id',
};

export const CAMPO_TIPO_CLAVE: Record<CampoDocumentoPersonal, string> = {
  contratoArdum: 'CONTRATO_ARDUM',
  contratoHegewisch: 'CONTRATO_HEGEWISCH',
  csf: 'CSF',
  acuseCita: 'ACUSE_CITA',
};

const SELECT_JOIN = `
  SELECT
    dp.id,
    p.id                     AS propietario_id,
    p.nombre                 AS propietario_nombre,
    p.numero_lote            AS propietario_numero_lote,
    p.curp                   AS propietario_curp,
    p.email                  AS propietario_email,
    p.telefono               AS propietario_telefono,
    p.activo                 AS propietario_activo,
    p.created_at             AS propietario_created_at,
    p.updated_at             AS propietario_updated_at,
    dp.contrato_ardum_id,
    da.tipo_documento_id     AS contrato_ardum_tipo_id,
    da.nombre_archivo        AS contrato_ardum_nombre,
    da.ruta_storage          AS contrato_ardum_ruta,
    da.mime_type             AS contrato_ardum_mime,
    da.tamano_bytes          AS contrato_ardum_tam,
    da.subido_por            AS contrato_ardum_subido_por,
    da.created_at            AS contrato_ardum_creado,
    dp.contrato_hegewisch_id,
    dh.tipo_documento_id     AS contrato_hegewisch_tipo_id,
    dh.nombre_archivo        AS contrato_hegewisch_nombre,
    dh.ruta_storage          AS contrato_hegewisch_ruta,
    dh.mime_type             AS contrato_hegewisch_mime,
    dh.tamano_bytes          AS contrato_hegewisch_tam,
    dh.subido_por            AS contrato_hegewisch_subido_por,
    dh.created_at            AS contrato_hegewisch_creado,
    dp.csf_id,
    dc.tipo_documento_id     AS csf_tipo_id,
    dc.nombre_archivo        AS csf_nombre,
    dc.ruta_storage          AS csf_ruta,
    dc.mime_type             AS csf_mime,
    dc.tamano_bytes          AS csf_tam,
    dc.subido_por            AS csf_subido_por,
    dc.created_at            AS csf_creado,
    dp.acuse_cita_id,
    de.tipo_documento_id     AS acuse_cita_tipo_id,
    de.nombre_archivo        AS acuse_cita_nombre,
    de.ruta_storage          AS acuse_cita_ruta,
    de.mime_type             AS acuse_cita_mime,
    de.tamano_bytes          AS acuse_cita_tam,
    de.subido_por            AS acuse_cita_subido_por,
    de.created_at            AS acuse_cita_creado
  FROM documentos_personales dp
  INNER JOIN propietarios p ON p.id = dp.propietario_id
  LEFT JOIN documentos da ON da.id = dp.contrato_ardum_id
  LEFT JOIN documentos dh ON dh.id = dp.contrato_hegewisch_id
  LEFT JOIN documentos dc ON dc.id = dp.csf_id
  LEFT JOIN documentos de ON de.id = dp.acuse_cita_id
  WHERE dp.deleted_at IS NULL AND p.deleted_at IS NULL
`;

export async function findListadoByEmpresa(empresaId: number): Promise<DocumentoPersonalRow[]> {
  const [rows] = await pool.execute<DocumentoPersonalRow[]>(
    `${SELECT_JOIN} AND p.empresa_id = ? ORDER BY p.nombre`,
    [empresaId],
  );
  return rows;
}

export async function findDetalleById(id: number): Promise<DocumentoPersonalRow | null> {
  const [rows] = await pool.execute<DocumentoPersonalRow[]>(`${SELECT_JOIN} AND dp.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function findTipoDocumentoIdByClave(clave: string): Promise<number | null> {
  const [rows] = await pool.execute<TipoDocumentoIdRow[]>(
    `SELECT id FROM tipos_documento WHERE clave = ? AND activo = 1 LIMIT 1`,
    [clave],
  );
  return rows[0]?.id ?? null;
}

export async function crear(
  input: PropietarioInput & { empresaId: number },
  actorId: number,
): Promise<number> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [propietarioResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO propietarios (empresa_id, nombre, numero_lote, curp, email, telefono, creado_por, modificado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.empresaId, input.nombre, input.numeroLote, input.curp, input.email, input.telefono, actorId, actorId],
    );
    const propietarioId = propietarioResult.insertId;

    const [dpResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO documentos_personales (propietario_id, creado_por, modificado_por)
       VALUES (?, ?, ?)`,
      [propietarioId, actorId, actorId],
    );

    await connection.commit();
    return dpResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function actualizarPropietario(
  documentoPersonalId: number,
  input: PropietarioInput,
  actorId: number,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE propietarios p
     INNER JOIN documentos_personales dp ON dp.propietario_id = p.id
     SET p.nombre = ?, p.numero_lote = ?, p.curp = ?, p.email = ?, p.telefono = ?, p.modificado_por = ?
     WHERE dp.id = ?`,
    [input.nombre, input.numeroLote, input.curp, input.email, input.telefono, actorId, documentoPersonalId],
  );
}

export async function eliminar(documentoPersonalId: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE documentos_personales SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, documentoPersonalId],
  );
}

export async function reemplazarDocumentoSlot(
  documentoPersonalId: number,
  campo: CampoDocumentoPersonal,
  archivo: {
    empresaId: number;
    propietarioId: number;
    tipoDocumentoId: number;
    nombreArchivo: string;
    rutaStorage: string;
    mimeType: string;
    tamanoBytes: number;
    subidoPor: number;
  },
): Promise<{ nuevoDocumentoId: number; anteriorDocumentoId: number | null; anteriorRutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [dpRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM documentos_personales WHERE id = ? FOR UPDATE`,
      [documentoPersonalId],
    );
    const anteriorDocumentoId = dpRows[0]?.actual_id ?? null;

    let anteriorRutaStorage: string | null = null;
    if (anteriorDocumentoId) {
      const [docRows] = await connection.execute<RutaStorageRow[]>(
        `SELECT ruta_storage FROM documentos WHERE id = ? LIMIT 1`,
        [anteriorDocumentoId],
      );
      anteriorRutaStorage = docRows[0]?.ruta_storage ?? null;
    }

    const [docResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO documentos (
         empresa_id, propietario_id, tipo_documento_id, nombre_archivo, ruta_storage,
         mime_type, tamano_bytes, subido_por, creado_por, modificado_por
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        archivo.empresaId,
        archivo.propietarioId,
        archivo.tipoDocumentoId,
        archivo.nombreArchivo,
        archivo.rutaStorage,
        archivo.mimeType,
        archivo.tamanoBytes,
        archivo.subidoPor,
        archivo.subidoPor,
        archivo.subidoPor,
      ],
    );
    const nuevoDocumentoId = docResult.insertId;

    await connection.execute<ResultSetHeader>(
      `UPDATE documentos_personales SET ${columna} = ?, modificado_por = ? WHERE id = ?`,
      [nuevoDocumentoId, archivo.subidoPor, documentoPersonalId],
    );

    if (anteriorDocumentoId) {
      await connection.execute<ResultSetHeader>(
        `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
        [archivo.subidoPor, anteriorDocumentoId],
      );
    }

    await connection.commit();
    return { nuevoDocumentoId, anteriorDocumentoId, anteriorRutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function quitarDocumentoSlot(
  documentoPersonalId: number,
  campo: CampoDocumentoPersonal,
  actorId: number,
): Promise<{ documentoId: number | null; rutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [dpRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM documentos_personales WHERE id = ? FOR UPDATE`,
      [documentoPersonalId],
    );
    const documentoId = dpRows[0]?.actual_id ?? null;

    let rutaStorage: string | null = null;
    if (documentoId) {
      const [docRows] = await connection.execute<RutaStorageRow[]>(
        `SELECT ruta_storage FROM documentos WHERE id = ? LIMIT 1`,
        [documentoId],
      );
      rutaStorage = docRows[0]?.ruta_storage ?? null;

      await connection.execute<ResultSetHeader>(
        `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
        [actorId, documentoId],
      );
    }

    await connection.execute<ResultSetHeader>(
      `UPDATE documentos_personales SET ${columna} = NULL, modificado_por = ? WHERE id = ?`,
      [actorId, documentoPersonalId],
    );

    await connection.commit();
    return { documentoId, rutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
