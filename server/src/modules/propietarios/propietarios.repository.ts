import { pool } from '../../config/database';
import type { PropietarioRow } from '../../types/db.types';

export async function findActivosByEmpresa(empresaId: number): Promise<PropietarioRow[]> {
  const [rows] = await pool.execute<PropietarioRow[]>(
    `SELECT id, empresa_id, nombre, curp, email, telefono, activo, created_at, updated_at
     FROM propietarios
     WHERE empresa_id = ? AND deleted_at IS NULL
     ORDER BY nombre`,
    [empresaId],
  );
  return rows;
}

export async function findByIdEnEmpresa(id: number, empresaId: number): Promise<PropietarioRow | null> {
  const [rows] = await pool.execute<PropietarioRow[]>(
    `SELECT id, empresa_id, nombre, curp, email, telefono, activo, created_at, updated_at
     FROM propietarios
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id, empresaId],
  );
  return rows[0] ?? null;
}
