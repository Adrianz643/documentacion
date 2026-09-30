import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { FielRegistroRow } from '../../types/db.types';
import type { CampoFiel } from './fiel.types';

export const CAMPO_COLUMNA: Record<CampoFiel, string> = {
  clavePrivada: 'clave_privada_id',
  certificado: 'certificado_id',
};

export const CAMPO_TIPO_CLAVE: Record<CampoFiel, string> = {
  clavePrivada: 'FIEL_CLAVE',
  certificado: 'FIEL_CERTIFICADO',
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
    fr.id,
    fr.propietario_id,
    p.nombre                 AS propietario_nombre,
    p.curp                   AS propietario_curp,
    p.email                  AS propietario_email,
    p.telefono               AS propietario_telefono,
    p.activo                 AS propietario_activo,
    p.created_at             AS propietario_created_at,
    p.updated_at             AS propietario_updated_at,
    fr.fecha_creacion,
    fr.fecha_vencimiento,
    fr.clave_privada_id,
    dk.tipo_documento_id     AS clave_privada_tipo_id,
    dk.nombre_archivo        AS clave_privada_nombre,
    dk.ruta_storage          AS clave_privada_ruta,
    dk.mime_type             AS clave_privada_mime,
    dk.tamano_bytes          AS clave_privada_tam,
    dk.subido_por            AS clave_privada_subido_por,
    dk.created_at            AS clave_privada_creado,
    fr.certificado_id,
    dc.tipo_documento_id     AS certificado_tipo_id,
    dc.nombre_archivo        AS certificado_nombre,
    dc.ruta_storage          AS certificado_ruta,
    dc.mime_type             AS certificado_mime,
    dc.tamano_bytes          AS certificado_tam,
    dc.subido_por            AS certificado_subido_por,
    dc.created_at            AS certificado_creado,
    fr.contrasena
  FROM fiel_registros fr
  INNER JOIN propietarios p ON p.id = fr.propietario_id
  LEFT JOIN documentos dk ON dk.id = fr.clave_privada_id
  LEFT JOIN documentos dc ON dc.id = fr.certificado_id
  WHERE fr.deleted_at IS NULL AND p.deleted_at IS NULL
`;

export async function findListadoByEmpresa(empresaId: number): Promise<FielRegistroRow[]> {
  const [rows] = await pool.execute<FielRegistroRow[]>(
    `${SELECT_JOIN} AND p.empresa_id = ? ORDER BY p.nombre`,
    [empresaId],
  );
  return rows;
}

export async function findDetalleById(id: number): Promise<FielRegistroRow | null> {
  const [rows] = await pool.execute<FielRegistroRow[]>(`${SELECT_JOIN} AND fr.id = ? LIMIT 1`, [id]);
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
  input: { propietarioId: number; fechaCreacion: string | null; fechaVencimiento: string | null },
  actorId: number,
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO fiel_registros (propietario_id, fecha_creacion, fecha_vencimiento, creado_por, modificado_por)
     VALUES (?, ?, ?, ?, ?)`,
    [input.propietarioId, input.fechaCreacion, input.fechaVencimiento, actorId, actorId],
  );
  return result.insertId;
}

export async function actualizar(
  id: number,
  input: { propietarioId: number; fechaCreacion: string | null; fechaVencimiento: string | null },
  actorId: number,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE fiel_registros
     SET propietario_id = ?, fecha_creacion = ?, fecha_vencimiento = ?, modificado_por = ?
     WHERE id = ?`,
    [input.propietarioId, input.fechaCreacion, input.fechaVencimiento, actorId, id],
  );
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE fiel_registros SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, id],
  );
}

export async function actualizarContrasena(id: number, contrasenaCifrada: string, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE fiel_registros SET contrasena = ?, modificado_por = ? WHERE id = ?`,
    [contrasenaCifrada, actorId, id],
  );
}

export async function eliminarContrasena(id: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE fiel_registros SET contrasena = NULL, modificado_por = ? WHERE id = ?`,
    [actorId, id],
  );
}

export async function reemplazarDocumentoSlot(
  fielId: number,
  campo: CampoFiel,
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

    const [frRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM fiel_registros WHERE id = ? FOR UPDATE`,
      [fielId],
    );
    const anteriorDocumentoId = frRows[0]?.actual_id ?? null;

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
      `UPDATE fiel_registros SET ${columna} = ?, modificado_por = ? WHERE id = ?`,
      [nuevoDocumentoId, archivo.subidoPor, fielId],
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
  fielId: number,
  campo: CampoFiel,
  actorId: number,
): Promise<{ rutaStorage: string | null }> {
  const columna = CAMPO_COLUMNA[campo];
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [frRows] = await connection.execute<SlotActualRow[]>(
      `SELECT ${columna} AS actual_id FROM fiel_registros WHERE id = ? FOR UPDATE`,
      [fielId],
    );
    const documentoId = frRows[0]?.actual_id ?? null;

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
      `UPDATE fiel_registros SET ${columna} = NULL, modificado_por = ? WHERE id = ?`,
      [actorId, fielId],
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
