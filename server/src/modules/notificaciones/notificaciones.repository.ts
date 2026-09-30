import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { NotificacionRow } from '../../types/db.types';
import type { CrearNotificacionInput } from './notificaciones.types';

const LIMITE_LISTADO = 30;

export async function findByUsuario(usuarioId: number): Promise<NotificacionRow[]> {
  const [rows] = await pool.execute<NotificacionRow[]>(
    `SELECT id, usuario_id, tipo, origen_tabla, origen_id, dias_restantes, titulo, cuerpo, ruta, leida, created_at
     FROM notificaciones
     WHERE usuario_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ${LIMITE_LISTADO}`,
    [usuarioId],
  );
  return rows;
}

export async function contarNoLeidas(usuarioId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND deleted_at IS NULL AND leida = 0`,
    [usuarioId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function marcarLeida(id: number, usuarioId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE notificaciones SET leida = 1, leida_en = NOW(), modificado_por = ?
     WHERE id = ? AND usuario_id = ?`,
    [usuarioId, id, usuarioId],
  );
}

export async function marcarTodasLeidas(usuarioId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE notificaciones SET leida = 1, leida_en = NOW(), modificado_por = ?
     WHERE usuario_id = ? AND deleted_at IS NULL AND leida = 0`,
    [usuarioId, usuarioId],
  );
}

export async function eliminar(id: number, usuarioId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE notificaciones SET deleted_at = NOW(), modificado_por = ?
     WHERE id = ? AND usuario_id = ?`,
    [usuarioId, id, usuarioId],
  );
}

export async function existeParaOrigenDia(
  origenTabla: string,
  origenId: number,
  usuarioId: number,
  diasRestantes: number,
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM notificaciones
     WHERE origen_tabla = ? AND origen_id = ? AND usuario_id = ? AND dias_restantes = ?
     LIMIT 1`,
    [origenTabla, origenId, usuarioId, diasRestantes],
  );
  return rows.length > 0;
}

export async function segundosDesdeUltimaParaOrigen(
  origenTabla: string,
  origenId: number,
  usuarioId: number,
  diasRestantes: number,
): Promise<number | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT TIMESTAMPDIFF(SECOND, MAX(created_at), NOW()) AS segundos
     FROM notificaciones
     WHERE origen_tabla = ? AND origen_id = ? AND usuario_id = ? AND dias_restantes = ?`,
    [origenTabla, origenId, usuarioId, diasRestantes],
  );
  const segundos = rows[0]?.segundos;
  return segundos === null || segundos === undefined ? null : Number(segundos);
}

export async function crear(input: CrearNotificacionInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO notificaciones (usuario_id, tipo, origen_tabla, origen_id, dias_restantes, titulo, cuerpo, ruta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.usuarioId,
      input.tipo,
      input.origenTabla,
      input.origenId,
      input.diasRestantes,
      input.titulo,
      input.cuerpo,
      input.ruta,
    ],
  );
  return result.insertId;
}
