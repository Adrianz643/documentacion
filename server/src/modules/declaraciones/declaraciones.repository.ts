import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { DeclaracionRow } from '../../types/db.types';
import type { CampoDeclaracion, CrearDeclaracionInput, ActualizarDeclaracionInput } from './declaraciones.types';

export const CAMPO_COLUMNA: Record<CampoDeclaracion, string> = {
  comprobante: 'comprobante_id',
};

export const CAMPO_TIPO_CLAVE: Record<CampoDeclaracion, string> = {
  comprobante: 'COMPROBANTE',
};

interface RutaStorageRow extends RowDataPacket {
  ruta_storage: string;
}

interface SlotActualRow extends RowDataPacket {
  actual_id: number | null;
}

interface TipoDocumentoIdRow extends RowDataPacket {
  id: number;
}

const SELECT_JOIN = `
  SELECT
    d.id,
    d.propietario_id,
    p.nombre                 AS propietario_nombre,
    p.curp                   AS propietario_curp,
    p.email                  AS propietario_email,
    p.telefono                AS propietario_telefono,
    p.activo                 AS propietario_activo,
    p.created_at             AS propietario_created_at,
    p.updated_at             AS propietario_updated_at,
    d.tipo,
    d.siguiente_pago_frecuencia,
    d.fecha_ultimo_pago,
    d.fecha_declaracion,
    d.periodo_mes,
    d.periodo_anio,
    d.comprobante_id,
    dc.tipo_documento_id     AS comprobante_tipo_id,
    dc.nombre_archivo        AS comprobante_nombre,
    dc.ruta_storage          AS comprobante_ruta,
    dc.mime_type             AS comprobante_mime,
    dc.tamano_bytes          AS comprobante_tam,
    dc.subido_por            AS comprobante_subido_por,
    dc.created_at            AS comprobante_creado
  FROM declaraciones d
  INNER JOIN propietarios p ON p.id = d.propietario_id
  LEFT JOIN documentos dc ON dc.id = d.comprobante_id
  WHERE d.deleted_at IS NULL AND p.deleted_at IS NULL
`;

export async function findListadoByEmpresa(empresaId: number): Promise<DeclaracionRow[]> {
  const [rows] = await pool.execute<DeclaracionRow[]>(
    `${SELECT_JOIN} AND p.empresa_id = ? ORDER BY p.nombre`,
    [empresaId],
  );
  return rows;
}

export async function findDetalleById(id: number): Promise<DeclaracionRow | null> {
  const [rows] = await pool.execute<DeclaracionRow[]>(`${SELECT_JOIN} AND d.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function findTipoDocumentoIdByClave(clave: string): Promise<number | null> {
  const [rows] = await pool.execute<TipoDocumentoIdRow[]>(
    `SELECT id FROM tipos_documento WHERE clave = ? AND activo = 1 LIMIT 1`,
    [clave],
  );
  return rows[0]?.id ?? null;
}

export async function crear(input: CrearDeclaracionInput, actorId: number): Promise<number> {
  const hoy = new Date();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO declaraciones (
       propietario_id, tipo, siguiente_pago_frecuencia,
       fecha_ultimo_pago, fecha_declaracion, periodo_mes, periodo_anio,
       creado_por, modificado_por
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.propietarioId,
      input.tipo,
      input.siguientePagoFrecuencia,
      input.fechaUltimoPago,
      input.fechaDeclaracion,
      hoy.getMonth() + 1,
      hoy.getFullYear(),
      actorId,
      actorId,
    ],
  );
  return result.insertId;
}

export async function actualizar(id: number, input: ActualizarDeclaracionInput, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE declaraciones
     SET propietario_id = ?, siguiente_pago_frecuencia = ?,
         fecha_ultimo_pago = ?, fecha_declaracion = ?, modificado_por = ?
     WHERE id = ?`,
    [
      input.propietarioId,
      input.siguientePagoFrecuencia,
      input.fechaUltimoPago,
      input.fechaDeclaracion,
      actorId,
      id,
    ],
  );
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE declaraciones SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, id],
  );
}

export async function reemplazarDocumentoSlot(
  declaracionId: number,
  campo: CampoDeclaracion,
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
): Promise<{ nuevoDocumentoId: number; anteriorRutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [dRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM declaraciones WHERE id = ? FOR UPDATE`,
      [declaracionId],
    );
    const anteriorDocumentoId = dRows[0]?.actual_id ?? null;

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
      `UPDATE declaraciones SET ${columna} = ?, modificado_por = ? WHERE id = ?`,
      [nuevoDocumentoId, archivo.subidoPor, declaracionId],
    );

    if (anteriorDocumentoId) {
      await connection.execute<ResultSetHeader>(
        `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
        [archivo.subidoPor, anteriorDocumentoId],
      );
    }

    await connection.commit();
    return { nuevoDocumentoId, anteriorRutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function quitarDocumentoSlot(
  declaracionId: number,
  campo: CampoDeclaracion,
  actorId: number,
): Promise<{ rutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [dRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM declaraciones WHERE id = ? FOR UPDATE`,
      [declaracionId],
    );
    const documentoId = dRows[0]?.actual_id ?? null;

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
      `UPDATE declaraciones SET ${columna} = NULL, modificado_por = ? WHERE id = ?`,
      [actorId, declaracionId],
    );

    await connection.commit();
    return { rutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
