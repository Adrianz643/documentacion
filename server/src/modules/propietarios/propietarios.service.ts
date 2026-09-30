import type { PropietarioRow } from '../../types/db.types';
import * as repository from './propietarios.repository';
import type { PropietarioDTO } from './propietarios.types';

function mapRowToDTO(row: PropietarioRow): PropietarioDTO {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    curp: row.curp,
    email: row.email,
    telefono: row.telefono,
    activo: row.activo === 1,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listarPorEmpresa(empresaId: number): Promise<PropietarioDTO[]> {
  const rows = await repository.findActivosByEmpresa(empresaId);
  return rows.map(mapRowToDTO);
}
