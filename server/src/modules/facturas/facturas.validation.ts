import { HttpError } from '../../utils/httpError';
import type { ActualizarFacturaInput, CampoFactura, CrearFacturaInput } from './facturas.types';
import { CAMPO_COLUMNA } from './facturas.repository';

type Body = Record<string, unknown>;

function requireId(body: Body, campo: string, etiqueta: string): number {
  const numero = Number(body[campo]);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new HttpError(400, `${etiqueta} es invalido`);
  }
  return numero;
}

function requireFecha(body: Body, campo: string, etiqueta: string): string {
  const valor = body[campo];
  if (typeof valor !== 'string' || !valor.trim() || Number.isNaN(Date.parse(valor))) {
    throw new HttpError(400, `${etiqueta} es requerida y debe ser una fecha valida`);
  }
  return valor;
}

export function parseCrearFacturaInput(body: unknown): CrearFacturaInput {
  const b = (body ?? {}) as Body;
  return {
    empresaId: requireId(b, 'empresaId', 'La empresa'),
    propietarioId: requireId(b, 'propietarioId', 'El propietario'),
    fecha: requireFecha(b, 'fecha', 'La fecha'),
  };
}

export function parseActualizarFacturaInput(body: unknown): ActualizarFacturaInput {
  const b = (body ?? {}) as Body;
  return {
    propietarioId: requireId(b, 'propietarioId', 'El propietario'),
    fecha: requireFecha(b, 'fecha', 'La fecha'),
  };
}

export function parseCampoFactura(valor: string | undefined): CampoFactura {
  if (!valor || !(valor in CAMPO_COLUMNA)) {
    throw new HttpError(400, 'El campo de documento es invalido');
  }
  return valor as CampoFactura;
}

export function parseEmpresaIdQuery(value: unknown): number {
  const empresaId = Number(value);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  return empresaId;
}
