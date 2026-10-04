import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/database';
import type {
  PermisoRow,
  UsuarioAuthRow,
  UsuarioPorResetTokenRow,
  UsuarioRecuperacionRow,
} from '../../types/db.types';

export async function findUsuarioByUsername(
  connection: PoolConnection,
  username: string,
): Promise<UsuarioAuthRow | null> {
  const [rows] = await connection.execute<UsuarioAuthRow[]>(
    `SELECT
       u.id AS usuario_id,
       u.username,
       u.password_hash,
       u.intentos_fallidos,
       u.bloqueado_hasta,
       u.rol_id,
       r.nombre AS rol_nombre,
       ceu.clave AS estado_clave,
       p.id AS persona_id,
       p.nombre AS persona_nombre,
       p.apellido_paterno AS persona_apellido_paterno,
       p.apellido_materno AS persona_apellido_materno,
       p.email AS persona_email
     FROM usuarios u
     INNER JOIN personas p ON p.id = u.persona_id
     INNER JOIN roles r ON r.id = u.rol_id
     INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
     WHERE u.username = ? AND u.deleted_at IS NULL
     LIMIT 1`,
    [username],
  );

  return rows[0] ?? null;
}

export async function findPermisosByRol(connection: PoolConnection, rolId: number): Promise<string[]> {
  const [rows] = await connection.execute<PermisoRow[]>(
    `SELECT DISTINCT p.nombre
     FROM permisos_rol pr
     INNER JOIN permisos p ON p.id = pr.permiso_id
     WHERE pr.rol_id = ?`,
    [rolId],
  );

  return rows.map((row) => row.nombre);
}

export async function findSubrolesByUsuarioId(connection: PoolConnection, usuarioId: number): Promise<string[]> {
  const [rows] = await connection.execute<PermisoRow[]>(
    `SELECT s.clave AS nombre
     FROM usuario_subroles us
     INNER JOIN subroles s ON s.id = us.subrol_id
     WHERE us.usuario_id = ?`,
    [usuarioId],
  );

  return rows.map((row) => row.nombre);
}

export interface RegistrarIntentoLoginParams {
  usuarioId: number | null;
  exitoso: boolean;
  ip: string;
  userAgent: string;
  descripcion: string;
}

export async function registrarIntentoLogin(
  connection: PoolConnection,
  params: RegistrarIntentoLoginParams,
): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `INSERT INTO intentos_login (usuario_id, exitoso, ip_address, user_agent, descripcion)
     VALUES (?, ?, ?, ?, ?)`,
    [params.usuarioId, params.exitoso ? 1 : 0, params.ip, params.userAgent, params.descripcion],
  );
}

export async function actualizarIntentosFallidos(
  connection: PoolConnection,
  usuarioId: number,
  intentosFallidos: number,
  bloqueadoHasta: Date | null,
): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?`,
    [intentosFallidos, bloqueadoHasta, usuarioId],
  );
}

export async function reiniciarIntentosYRegistrarLogin(connection: PoolConnection, usuarioId: number): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE id = ?`,
    [usuarioId],
  );
}

export interface CrearSesionParams {
  usuarioId: number;
  tokenHash: string;
  ip: string;
  userAgent: string;
  expiraEn: Date;
}

export async function crearSesion(connection: PoolConnection, params: CrearSesionParams): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `INSERT INTO sesiones (usuario_id, token, ip_address, user_agent, expira_en)
     VALUES (?, ?, ?, ?, ?)`,
    [params.usuarioId, params.tokenHash, params.ip, params.userAgent, params.expiraEn],
  );
}

export async function cerrarSesionPorTokenHash(tokenHash: string, motivoCierre: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE sesiones SET cerrada_en = NOW(), motivo_cierre = ? WHERE token = ? AND cerrada_en IS NULL`,
    [motivoCierre, tokenHash],
  );
}

export async function findUsuarioActivoPorUsernameOEmail(
  usuarioOCorreo: string,
): Promise<UsuarioRecuperacionRow | null> {
  const [rows] = await pool.execute<UsuarioRecuperacionRow[]>(
    `SELECT u.id AS usuario_id, p.nombre AS persona_nombre, p.email AS persona_email
     FROM usuarios u
     INNER JOIN personas p ON p.id = u.persona_id
     INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
     WHERE (u.username = ? OR p.email = ?) AND u.deleted_at IS NULL AND ceu.clave = 'ACTIVO'
     LIMIT 1`,
    [usuarioOCorreo, usuarioOCorreo],
  );
  return rows[0] ?? null;
}

export async function guardarResetToken(
  usuarioId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE usuarios SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?`,
    [tokenHash, expiresAt, usuarioId],
  );
}

export async function findUsuarioActivoPorResetTokenHash(
  tokenHash: string,
): Promise<UsuarioPorResetTokenRow | null> {
  const [rows] = await pool.execute<UsuarioPorResetTokenRow[]>(
    `SELECT u.id AS usuario_id
     FROM usuarios u
     INNER JOIN cat_estados_usuario ceu ON ceu.id = u.estado_id
     WHERE u.reset_token_hash = ? AND u.reset_token_expires_at > NOW()
       AND u.deleted_at IS NULL AND ceu.clave = 'ACTIVO'
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function restablecerPasswordYLimpiarToken(usuarioId: number, passwordHash: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE usuarios
     SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL,
         intentos_fallidos = 0, bloqueado_hasta = NULL
     WHERE id = ?`,
    [passwordHash, usuarioId],
  );
}

export async function cerrarSesionesActivasDeUsuario(usuarioId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE sesiones SET cerrada_en = NOW(), motivo_cierre = 'ADMIN' WHERE usuario_id = ? AND cerrada_en IS NULL`,
    [usuarioId],
  );
}
