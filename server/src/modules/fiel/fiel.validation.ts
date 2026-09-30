import { HttpError } from '../../utils/httpError';
import type { ActualizarFielInput, CampoFiel, CrearFielInput } from './fiel.types';
import { CAMPO_COLUMNA } from './fiel.repository';

type Body = Record<string, unknown>;

function requireId(body: Body, campo: string, etiqueta: string): number {
  const numero = Number(body[campo]);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new HttpError(400, `${etiqueta} es invalido`);
  }
  return numero;
}

function parseFecha(body: Body, campo: string, etiqueta: string): string | null {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) {
    throw new HttpError(400, `${etiqueta} no es una fecha valida`);
  }
  return valor;
}

export function parseCrearFielInput(body: unknown): CrearFielInput {
  const b = (body ?? {}) as Body;
  const empresaId = requireId(b, 'empresaId', 'La empresa');
  const propietarioId = requireId(b, 'propietarioId', 'El propietario');
  const fechaCreacion = parseFecha(b, 'fechaCreacion', 'La fecha de creacion');
  const fechaVencimiento = parseFecha(b, 'fechaVencimiento', 'La fecha de vencimiento');
  return { empresaId, propietarioId, fechaCreacion, fechaVencimiento };
}

export function parseActualizarFielInput(body: unknown): ActualizarFielInput {
  const b = (body ?? {}) as Body;
  const propietarioId = requireId(b, 'propietarioId', 'El propietario');
  const fechaCreacion = parseFecha(b, 'fechaCreacion', 'La fecha de creacion');
  const fechaVencimiento = parseFecha(b, 'fechaVencimiento', 'La fecha de vencimiento');
  return { propietarioId, fechaCreacion, fechaVencimiento };
}

const CONTRASENA_MAX_LENGTH = 128;

export function parseContrasenaFielInput(body: unknown): string {
  const b = (body ?? {}) as Body;
  const valor = b.contrasena;
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new HttpError(400, 'La contraseña es requerida');
  }
  if (valor.length > CONTRASENA_MAX_LENGTH) {
    throw new HttpError(400, `La contraseña no puede exceder ${CONTRASENA_MAX_LENGTH} caracteres`);
  }
  return valor;
}

export function parseCampoFiel(valor: string | undefined): CampoFiel {
  if (!valor || !(valor in CAMPO_COLUMNA)) {
    throw new HttpError(400, 'El campo de documento es invalido');
  }
  return valor as CampoFiel;
}

export function parseEmpresaIdQuery(value: unknown): number {
  const empresaId = Number(value);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  return empresaId;
}
