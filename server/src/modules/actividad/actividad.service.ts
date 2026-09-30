import * as repository from './actividad.repository';
import type { ActividadRawRow } from './actividad.repository';
import type { ActividadDTO, RegistrarActividadInput } from './actividad.types';

const ROLES_ADMIN = new Set(['admin', 'superadmin']);

function mapRow(row: ActividadRawRow): ActividadDTO {
  return {
    id: row.id,
    usuario: row.usuario_nombre?.trim() || 'Sistema',
    rol: row.rol_nombre ?? 'N/D',
    modulo: row.modulo,
    accion: row.accion,
    descripcion: row.descripcion,
    fecha: row.created_at.toISOString(),
  };
}

export async function registrar(input: RegistrarActividadInput): Promise<void> {
  try {
    await repository.registrar(input);
  } catch (error) {
    console.error('No fue posible registrar la actividad:', error);
  }
}

export async function listar(actor: { sub: number; rol: string }): Promise<ActividadDTO[]> {
  const esAdmin = ROLES_ADMIN.has(actor.rol.toLowerCase());
  const rows = esAdmin ? await repository.findTodas() : await repository.findPorUsuario(actor.sub);
  return rows.map(mapRow);
}
