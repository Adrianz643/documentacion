import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';

export interface InsertarDocumentoGenericoInput {
  empresaId: number;
  propietarioId: number | null;
  tipoDocumentoId: number;
  nombreArchivo: string;
  rutaStorage: string;
  mimeType: string;
  tamanoBytes: number;
  subidoPor: number;
}

export async function insertarDocumentoGenerico(input: InsertarDocumentoGenericoInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO documentos (
       empresa_id, propietario_id, tipo_documento_id, nombre_archivo, ruta_storage,
       mime_type, tamano_bytes, subido_por, creado_por, modificado_por
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.empresaId,
      input.propietarioId,
      input.tipoDocumentoId,
      input.nombreArchivo,
      input.rutaStorage,
      input.mimeType,
      input.tamanoBytes,
      input.subidoPor,
      input.subidoPor,
      input.subidoPor,
    ],
  );
  return result.insertId;
}
