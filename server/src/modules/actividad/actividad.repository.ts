import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { RegistrarActividadInput } from './actividad.types';

export interface ActividadRawRow extends RowDataPacket {
  id: number;
  modulo: string;
  accion: string;
  descripcion: string;
  created_at: Date;
  usuario_nombre: string | null;
  rol_nombre: string | null;
}

const LIMITE_LISTADO = 500;

const SELECT_BASE = `
  SELECT al.id, al.modulo, al.accion, al.descripcion, al.created_at,
         CONCAT(p.nombre, ' ', p.apellido_paterno) AS usuario_nombre,
         r.nombre AS rol_nombre
  FROM actividad_log al
  LEFT JOIN usuarios u ON u.id = al.usuario_id
  LEFT JOIN personas p ON p.id = u.persona_id
  LEFT JOIN roles r ON r.id = u.rol_id
`;

export async function registrar(input: RegistrarActividadInput): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO actividad_log
       (usuario_id, modulo, accion, descripcion, referencia_tabla, referencia_id, ip_address, creado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.usuarioId,
      input.modulo,
      input.accion,
      input.descripcion,
      input.referenciaTabla ?? null,
      input.referenciaId ?? null,
      input.ip ?? null,
      input.usuarioId,
    ],
  );
}

export async function findTodas(): Promise<ActividadRawRow[]> {
  const [rows] = await pool.execute<ActividadRawRow[]>(
    `${SELECT_BASE} ORDER BY al.created_at DESC LIMIT ${LIMITE_LISTADO}`,
  );
  return rows;
}

export async function findPorUsuario(usuarioId: number): Promise<ActividadRawRow[]> {
  const [rows] = await pool.execute<ActividadRawRow[]>(
    `${SELECT_BASE} WHERE al.usuario_id = ? ORDER BY al.created_at DESC LIMIT ${LIMITE_LISTADO}`,
    [usuarioId],
  );
  return rows;
}
