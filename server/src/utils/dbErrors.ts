interface MysqlDuplicateError {
  code?: string;
  sqlMessage?: string;
}

/**
 * Traduce un error ER_DUP_ENTRY de MySQL al nombre del campo en espanol, inspeccionando
 * el texto del error (ej. "Duplicate entry 'admin' for key 'usuarios.username'").
 * Devuelve null si el error no es de llave duplicada.
 */
export function mapDuplicateKeyError(error: unknown): string | null {
  const err = error as MysqlDuplicateError | null;
  if (err?.code !== 'ER_DUP_ENTRY') {
    return null;
  }

  const mensaje = err.sqlMessage ?? '';
  if (mensaje.includes('username')) return 'nombre de usuario';
  if (mensaje.includes('uq_fiel_propietario') || mensaje.includes('propietario_id')) {
    return 'propietario (ya tiene un registro en este modulo)';
  }
  if (mensaje.includes('curp')) return 'CURP';
  if (mensaje.includes('email')) return 'correo electronico';
  return 'valor capturado';
}
