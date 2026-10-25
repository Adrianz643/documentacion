import { HttpError } from '../../utils/httpError';
import type { ActualizarFacturaHlInput, CampoFacturaHl, CrearFacturaHlInput } from './facturas-hl.types';
import { CAMPO_COLUMNA } from './facturas-hl.repository';

type Body = Record<string, unknown>;

const CLIENTE_MAX_LENGTH = 180;

function requireCliente(body: Body): string {
  const valor = body.cliente;
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new HttpError(400, 'El cliente es requerido');
  }
  const recortado = valor.trim();
  if (recortado.length > CLIENTE_MAX_LENGTH) {
    throw new HttpError(400, `El cliente no puede exceder ${CLIENTE_MAX_LENGTH} caracteres`);
  }
  return recortado;
}

function requireFecha(body: Body, campo: string, etiqueta: string): string {
  const valor = body[campo];
  if (typeof valor !== 'string' || !valor.trim() || Number.isNaN(Date.parse(valor))) {
    throw new HttpError(400, `${etiqueta} es requerida y debe ser una fecha valida`);
  }
  return valor;
}

function optionalFecha(body: Body, campo: string, etiqueta: string): string | null {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) {
    throw new HttpError(400, `${etiqueta} debe ser una fecha valida`);
  }
  return valor;
}

function validarVencimiento(fecha: string, fechaVencimiento: string | null): string | null {
  if (fechaVencimiento && fechaVencimiento < fecha) {
    throw new HttpError(400, 'La fecha de vencimiento no puede ser anterior a la fecha de creacion');
  }
  return fechaVencimiento;
}

export function parseCrearFacturaHlInput(body: unknown): CrearFacturaHlInput {
  const b = (body ?? {}) as Body;
  const fecha = requireFecha(b, 'fecha', 'La fecha');
  return {
    cliente: requireCliente(b),
    fecha,
    fechaVencimiento: validarVencimiento(fecha, optionalFecha(b, 'fechaVencimiento', 'La fecha de vencimiento')),
  };
}

export function parseActualizarFacturaHlInput(body: unknown): ActualizarFacturaHlInput {
  const b = (body ?? {}) as Body;
  const fecha = requireFecha(b, 'fecha', 'La fecha');
  return {
    cliente: requireCliente(b),
    fecha,
    fechaVencimiento: validarVencimiento(fecha, optionalFecha(b, 'fechaVencimiento', 'La fecha de vencimiento')),
  };
}

export function parseCampoFacturaHl(valor: string | undefined): CampoFacturaHl {
  if (!valor || !(valor in CAMPO_COLUMNA)) {
    throw new HttpError(400, 'El campo de documento es invalido');
  }
  return valor as CampoFacturaHl;
}
