import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { ColumnaPersonalizadaRow } from '../../types/db.types';
import type { CrearColumnaPersonalizadaInput } from './columnas-personalizadas.types';

interface OrdenMaximoRow extends RowDataPacket {
  maximo: number;
}

export async function findByEmpresaSeccion(empresaId: number, seccion: string): Promise<ColumnaPersonalizadaRow[]> {
  const [rows] = await pool.execute<ColumnaPersonalizadaRow[]>(
    `SELECT id, empresa_id, seccion, nombre, tipo, orden
     FROM columnas_personalizadas
     WHERE empresa_id = ? AND seccion = ? AND deleted_at IS NULL
     ORDER BY orden, id`,
    [empresaId, seccion],
  );
  return rows;
}

export async function crear(input: CrearColumnaPersonalizadaInput, actorId: number): Promise<number> {
  const [ordenRows] = await pool.execute<OrdenMaximoRow[]>(
    `SELECT COALESCE(MAX(orden), 0) AS maximo FROM columnas_personalizadas
     WHERE empresa_id = ? AND seccion = ? AND deleted_at IS NULL`,
    [input.empresaId, input.seccion],
  );
  const siguienteOrden = (ordenRows[0]?.maximo ?? 0) + 1;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO columnas_personalizadas (empresa_id, seccion, nombre, tipo, orden, creado_por, modificado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.empresaId, input.seccion, input.nombre, input.tipo, siguienteOrden, actorId, actorId],
  );
  return result.insertId;
}
