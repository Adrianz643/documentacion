import type { ColumnaPersonalizadaRow } from '../../types/db.types';
import * as repository from './columnas-personalizadas.repository';
import type { ColumnaPersonalizadaDTO, CrearColumnaPersonalizadaInput } from './columnas-personalizadas.types';

function mapRowToDTO(row: ColumnaPersonalizadaRow): ColumnaPersonalizadaDTO {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    seccion: row.seccion,
    nombre: row.nombre,
    tipo: row.tipo,
    orden: row.orden,
  };
}

export async function listar(empresaId: number, seccion: string): Promise<ColumnaPersonalizadaDTO[]> {
  const rows = await repository.findByEmpresaSeccion(empresaId, seccion);
  return rows.map(mapRowToDTO);
}

export async function crear(input: CrearColumnaPersonalizadaInput, actorId: number): Promise<ColumnaPersonalizadaDTO[]> {
  await repository.crear(input, actorId);
  return listar(input.empresaId, input.seccion);
}
