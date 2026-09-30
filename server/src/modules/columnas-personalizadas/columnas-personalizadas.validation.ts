import { HttpError } from '../../utils/httpError';
import type { CrearColumnaPersonalizadaInput, TipoColumnaPersonalizada } from './columnas-personalizadas.types';

type Body = Record<string, unknown>;

const TIPOS_VALIDOS: TipoColumnaPersonalizada[] = ['texto', 'numero', 'fecha', 'archivo', 'boolean'];

export function parseEmpresaIdQuery(value: unknown): number {
  const empresaId = Number(value);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  return empresaId;
}

export function parseSeccionQuery(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'seccion es requerida');
  }
  return value.trim();
}

export function parseCrearColumnaInput(body: unknown): CrearColumnaPersonalizadaInput {
  const b = (body ?? {}) as Body;
  const empresaId = parseEmpresaIdQuery(b.empresaId);
  const seccion = parseSeccionQuery(b.seccion);

  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : '';
  if (!nombre || nombre.length > 120) {
    throw new HttpError(400, 'El nombre de la columna es invalido');
  }

  const tipo = b.tipo;
  if (typeof tipo !== 'string' || !TIPOS_VALIDOS.includes(tipo as TipoColumnaPersonalizada)) {
    throw new HttpError(400, 'El tipo de columna es invalido');
  }

  return { empresaId, seccion, nombre, tipo: tipo as TipoColumnaPersonalizada };
}
