import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { PermisoRow, SubrolRow, UsuarioDetalleRow, UsuarioListadoRow, UsuarioPerfilRow } from '../../types/db.types';
import type { PersonaInput } from './usuarios.types';

export async function findPerfilById(usuarioId: number): Promise<UsuarioPerfilRow | null> {
  const [rows] = await pool.execute<UsuarioPerfilRow[]>(
    `SELECT
       u.id AS usuario_id,
       u.username,
       u.rol_id,
       r.nombre AS rol_nombre,
       ceu.clave AS estado_clave,
       u.ultimo_login,
       p.id AS persona_id,
       p.nombre AS persona_nombre,
       p.apellido_paterno AS persona_apellido_paterno,
       p.apellido_materno AS persona_apellido_materno,
       p.email AS persona_email
     FROM usuarios u
     INNER JOIN personas p ON p.id = u.persona_id
     INNER JOIN roles r ON r.id = u.rol_id
     INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
     WHERE u.id = ? AND u.deleted_at IS NULL
     LIMIT 1`,
    [usuarioId],
  );

  return rows[0] ?? null;
}

export async function findRolNombreById(rolId: number): Promise<string | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT nombre FROM roles WHERE id = ? LIMIT 1`,
    [rolId],
  );
  return (rows[0]?.nombre as string | undefined) ?? null;
}

export async function findPermisosByRol(rolId: number): Promise<string[]> {
  const [rows] = await pool.execute<PermisoRow[]>(
    `SELECT DISTINCT p.nombre
     FROM permisos_rol pr
     INNER JOIN permisos p ON p.id = pr.permiso_id
     WHERE pr.rol_id = ?`,
    [rolId],
  );

  return rows.map((row) => row.nombre);
}

export async function findSubrolesCatalogo(): Promise<SubrolRow[]> {
  const [rows] = await pool.execute<SubrolRow[]>(
    `SELECT id, clave, nombre FROM subroles WHERE activo = 1 ORDER BY id`,
  );
  return rows;
}

export async function findSubrolIdsPorClaves(claves: string[]): Promise<number[]> {
  if (claves.length === 0) {
    return [];
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM subroles WHERE activo = 1 AND clave IN (?)`,
    [claves],
  );
  return rows.map((row) => row.id as number);
}

export async function findSubrolesPorUsuario(usuarioId: number): Promise<string[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT s.clave
     FROM usuario_subroles us
     INNER JOIN subroles s ON s.id = us.subrol_id
     WHERE us.usuario_id = ?`,
    [usuarioId],
  );
  return rows.map((row) => row.clave as string);
}

export async function findSubrolesPorUsuarios(usuarioIds: number[]): Promise<Map<number, string[]>> {
  const mapa = new Map<number, string[]>();
  if (usuarioIds.length === 0) {
    return mapa;
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT us.usuario_id, s.clave
     FROM usuario_subroles us
     INNER JOIN subroles s ON s.id = us.subrol_id
     WHERE us.usuario_id IN (?)`,
    [usuarioIds],
  );
  for (const row of rows) {
    const usuarioId = row.usuario_id as number;
    if (!mapa.has(usuarioId)) {
      mapa.set(usuarioId, []);
    }
    mapa.get(usuarioId)!.push(row.clave as string);
  }
  return mapa;
}

export async function reemplazarSubrolesUsuario(
  connection: PoolConnection,
  usuarioId: number,
  subrolIds: number[],
  actorId: number,
): Promise<void> {
  await connection.execute<ResultSetHeader>(`DELETE FROM usuario_subroles WHERE usuario_id = ?`, [usuarioId]);
  if (subrolIds.length === 0) {
    return;
  }
  const values = subrolIds.map((subrolId) => [usuarioId, subrolId, actorId, actorId]);
  await connection.query<ResultSetHeader>(
    `INSERT INTO usuario_subroles (usuario_id, subrol_id, creado_por, modificado_por) VALUES ?`,
    [values],
  );
}

export interface ListarUsuariosParams {
  page: number;
  perPage: number;
  search: string;
}

const LISTADO_SELECT = `
  SELECT
    u.id AS usuario_id,
    u.username,
    u.ultimo_login,
    r.id AS rol_id,
    r.nombre AS rol_nombre,
    ceu.id AS estado_id,
    ceu.clave AS estado_clave,
    ceu.nombre AS estado_nombre,
    p.id AS persona_id,
    p.nombre AS persona_nombre,
    p.apellido_paterno AS persona_apellido_paterno,
    p.apellido_materno AS persona_apellido_materno,
    p.email AS persona_email
  FROM usuarios u
  INNER JOIN personas p ON p.id = u.persona_id
  INNER JOIN roles r ON r.id = u.rol_id
  INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
  WHERE u.deleted_at IS NULL AND p.deleted_at IS NULL
    AND (u.username LIKE ? OR p.nombre LIKE ? OR p.apellido_paterno LIKE ? OR p.apellido_materno LIKE ? OR p.email LIKE ?)
`;

export async function contarListado(params: Pick<ListarUsuariosParams, 'search'>): Promise<number> {
  const like = `%${params.search}%`;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM (${LISTADO_SELECT}) AS listado`,
    [like, like, like, like, like],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function findListado(params: ListarUsuariosParams): Promise<UsuarioListadoRow[]> {
  const like = `%${params.search}%`;
  const offset = (params.page - 1) * params.perPage;
  const [rows] = await pool.query<UsuarioListadoRow[]>(
    `${LISTADO_SELECT} ORDER BY p.apellido_paterno, p.apellido_materno, p.nombre LIMIT ? OFFSET ?`,
    [like, like, like, like, like, params.perPage, offset],
  );
  return rows;
}

export async function findDetalleById(usuarioId: number): Promise<UsuarioDetalleRow | null> {
  const [rows] = await pool.execute<UsuarioDetalleRow[]>(
    `SELECT
       u.id AS usuario_id,
       u.username,
       u.rol_id,
       r.nombre AS rol_nombre,
       u.estado_id,
       ceu.clave AS estado_clave,
       ceu.nombre AS estado_nombre,
       u.ultimo_login,
       p.id AS persona_id,
       p.tipo_documento_id,
       p.pais_id,
       p.nombre AS persona_nombre,
       p.apellido_paterno AS persona_apellido_paterno,
       p.apellido_materno AS persona_apellido_materno,
       p.fecha_nacimiento,
       p.curp,
       p.rfc,
       p.email AS persona_email,
       p.telefono
     FROM usuarios u
     INNER JOIN personas p ON p.id = u.persona_id
     INNER JOIN roles r ON r.id = u.rol_id
     INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
     WHERE u.id = ? AND u.deleted_at IS NULL AND p.deleted_at IS NULL
     LIMIT 1`,
    [usuarioId],
  );

  return rows[0] ?? null;
}

export async function crearPersona(
  connection: PoolConnection,
  persona: PersonaInput & { creadoPor: number },
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO personas (
       tipo_documento_id, pais_id, nombre, apellido_paterno, apellido_materno,
       fecha_nacimiento, curp, rfc, email, telefono, creado_por
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      persona.tipoDocumentoId,
      persona.paisId,
      persona.nombre,
      persona.apellidoPaterno,
      persona.apellidoMaterno,
      persona.fechaNacimiento,
      persona.curp,
      persona.rfc,
      persona.email,
      persona.telefono,
      persona.creadoPor,
    ],
  );
  return result.insertId;
}

export interface CrearUsuarioParams {
  personaId: number;
  rolId: number;
  estadoId: number;
  username: string;
  passwordHash: string;
  creadoPor: number;
}

export async function crearUsuario(connection: PoolConnection, params: CrearUsuarioParams): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO usuarios (persona_id, rol_id, estado_id, username, password_hash, creado_por)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [params.personaId, params.rolId, params.estadoId, params.username, params.passwordHash, params.creadoPor],
  );
  return result.insertId;
}

export async function actualizarPersona(
  connection: PoolConnection,
  personaId: number,
  persona: PersonaInput & { modificadoPor: number },
): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `UPDATE personas SET
       tipo_documento_id = ?, pais_id = ?, nombre = ?, apellido_paterno = ?, apellido_materno = ?,
       fecha_nacimiento = ?, curp = ?, rfc = ?, email = ?, telefono = ?, modificado_por = ?
     WHERE id = ?`,
    [
      persona.tipoDocumentoId,
      persona.paisId,
      persona.nombre,
      persona.apellidoPaterno,
      persona.apellidoMaterno,
      persona.fechaNacimiento,
      persona.curp,
      persona.rfc,
      persona.email,
      persona.telefono,
      persona.modificadoPor,
      personaId,
    ],
  );
}

export interface ActualizarUsuarioParams {
  username: string;
  rolId: number;
  estadoId: number;
  passwordHash: string | null;
  modificadoPor: number;
}

export async function eliminarUsuario(usuarioId: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE usuarios SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, usuarioId],
  );
}

export async function actualizarUsuario(
  connection: PoolConnection,
  usuarioId: number,
  params: ActualizarUsuarioParams,
): Promise<void> {
  if (params.passwordHash) {
    await connection.execute<ResultSetHeader>(
      `UPDATE usuarios SET username = ?, rol_id = ?, estado_id = ?, password_hash = ?, modificado_por = ?
       WHERE id = ?`,
      [params.username, params.rolId, params.estadoId, params.passwordHash, params.modificadoPor, usuarioId],
    );
    return;
  }

  await connection.execute<ResultSetHeader>(
    `UPDATE usuarios SET username = ?, rol_id = ?, estado_id = ?, modificado_por = ?
     WHERE id = ?`,
    [params.username, params.rolId, params.estadoId, params.modificadoPor, usuarioId],
  );
}
