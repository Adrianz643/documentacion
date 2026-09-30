import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { AparienciaRow } from '../../types/db.types';

export async function findModoOscuroByUsuarioId(usuarioId: number): Promise<boolean> {
  const [rows] = await pool.execute<AparienciaRow[]>(
    `SELECT usuario_id, modo_oscuro FROM apariencia WHERE usuario_id = ? LIMIT 1`,
    [usuarioId],
  );
  return rows[0]?.modo_oscuro === 1;
}

export async function upsertModoOscuro(usuarioId: number, modoOscuro: boolean, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO apariencia (usuario_id, modo_oscuro, creado_por, modificado_por)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE modo_oscuro = VALUES(modo_oscuro), modificado_por = VALUES(modificado_por)`,
    [usuarioId, modoOscuro ? 1 : 0, actorId, actorId],
  );
}
