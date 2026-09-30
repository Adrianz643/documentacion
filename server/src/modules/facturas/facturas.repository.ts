import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { FacturaRow } from '../../types/db.types';
import type { CampoFactura, CrearFacturaInput, ActualizarFacturaInput } from './facturas.types';

export const CAMPO_COLUMNA: Record<CampoFactura, string> = {
  comprobante: 'comprobante_id',
};

export const CAMPO_TIPO_CLAVE: Record<CampoFactura, string> = {
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
    f.id,
    f.propietario_id,
    p.nombre                 AS propietario_nombre,
    p.curp                   AS propietario_curp,
    p.email                  AS propietario_email,
    p.telefono                AS propietario_telefono,
    p.activo                 AS propietario_activo,
    p.created_at             AS propietario_created_at,
    p.updated_at             AS propietario_updated_at,
    f.fecha,
    f.comprobante_id,
    dc.tipo_documento_id     AS comprobante_tipo_id,
    dc.nombre_archivo        AS comprobante_nombre,
    dc.ruta_storage          AS comprobante_ruta,
    dc.mime_type             AS comprobante_mime,
    dc.tamano_bytes          AS comprobante_tam,
    dc.subido_por            AS comprobante_subido_por,
    dc.created_at            AS comprobante_creado
  FROM facturas f
  INNER JOIN propietarios p ON p.id = f.propietario_id
  LEFT JOIN documentos dc ON dc.id = f.comprobante_id
  WHERE f.deleted_at IS NULL AND p.deleted_at IS NULL
`;

export async function findListadoByEmpresa(empresaId: number): Promise<FacturaRow[]> {
  const [rows] = await pool.execute<FacturaRow[]>(
    `${SELECT_JOIN} AND p.empresa_id = ? ORDER BY f.fecha DESC, p.nombre`,
    [empresaId],
  );
  return rows;
}

export async function findDetalleById(id: number): Promise<FacturaRow | null> {
  const [rows] = await pool.execute<FacturaRow[]>(`${SELECT_JOIN} AND f.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function findTipoDocumentoIdByClave(clave: string): Promise<number | null> {
  const [rows] = await pool.execute<TipoDocumentoIdRow[]>(
    `SELECT id FROM tipos_documento WHERE clave = ? AND activo = 1 LIMIT 1`,
    [clave],
  );
  return rows[0]?.id ?? null;
}

export async function crear(input: CrearFacturaInput, actorId: number): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO facturas (propietario_id, fecha, creado_por, modificado_por)
     VALUES (?, ?, ?, ?)`,
    [input.propietarioId, input.fecha, actorId, actorId],
  );
  return result.insertId;
}

export async function actualizar(id: number, input: ActualizarFacturaInput, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE facturas SET propietario_id = ?, fecha = ?, modificado_por = ? WHERE id = ?`,
    [input.propietarioId, input.fecha, actorId, id],
  );
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE facturas SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, id],
  );
}

export async function reemplazarDocumentoSlot(
  facturaId: number,
  campo: CampoFactura,
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

    const [fRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM facturas WHERE id = ? FOR UPDATE`,
      [facturaId],
    );
    const anteriorDocumentoId = fRows[0]?.actual_id ?? null;

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
      `UPDATE facturas SET ${columna} = ?, modificado_por = ? WHERE id = ?`,
      [nuevoDocumentoId, archivo.subidoPor, facturaId],
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
  facturaId: number,
  campo: CampoFactura,
  actorId: number,
): Promise<{ rutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [fRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM facturas WHERE id = ? FOR UPDATE`,
      [facturaId],
    );
    const documentoId = fRows[0]?.actual_id ?? null;

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
      `UPDATE facturas SET ${columna} = NULL, modificado_por = ? WHERE id = ?`,
      [actorId, facturaId],
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
