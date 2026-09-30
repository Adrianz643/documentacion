import { pool } from '../../config/database';
import type { EstadoUsuarioRow, PaisRow, RolRow, SubrolRow, TipoDocumentoRow } from '../../types/db.types';

export async function findPaises(): Promise<PaisRow[]> {
  const [rows] = await pool.execute<PaisRow[]>(
    `SELECT id, codigo_iso, nombre FROM cat_paises WHERE activo = 1 ORDER BY nombre`,
  );
  return rows;
}

export async function findTiposDocumento(): Promise<TipoDocumentoRow[]> {
  const [rows] = await pool.execute<TipoDocumentoRow[]>(
    `SELECT id, clave, nombre FROM cat_tipos_documento WHERE activo = 1 ORDER BY nombre`,
  );
  return rows;
}

export async function findRoles(): Promise<RolRow[]> {
  const [rows] = await pool.execute<RolRow[]>(
    `SELECT id, nombre, descripcion FROM roles WHERE activo = 1 ORDER BY nombre`,
  );
  return rows;
}

export async function findEstadosUsuario(): Promise<EstadoUsuarioRow[]> {
  const [rows] = await pool.execute<EstadoUsuarioRow[]>(
    `SELECT id, clave, nombre FROM cat_estados_usuario ORDER BY id`,
  );
  return rows;
}

export async function findSubroles(): Promise<SubrolRow[]> {
  const [rows] = await pool.execute<SubrolRow[]>(
    `SELECT id, clave, nombre FROM subroles WHERE activo = 1 ORDER BY id`,
  );
  return rows;
}
