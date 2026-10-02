import { HttpError } from '../../utils/httpError';
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

export async function obtenerEmpresaId(id: number): Promise<number | null> {
  const columna = await repository.findById(id);
  return columna?.empresa_id ?? null;
}

export async function eliminar(id: number, actorId: number): Promise<ColumnaPersonalizadaDTO[]> {
  const columna = await repository.findById(id);
  if (!columna) {
    throw new HttpError(404, 'Columna no encontrada');
  }
  await repository.eliminar(id, actorId);
  return listar(columna.empresa_id, columna.seccion);
}
