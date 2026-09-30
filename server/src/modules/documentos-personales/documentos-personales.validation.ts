import { HttpError } from '../../utils/httpError';
import type { CampoDocumentoPersonal, CrearDocumentoPersonalInput, PropietarioInput } from './documentos-personales.types';
import { CAMPO_COLUMNA } from './documentos-personales.repository';

type Body = Record<string, unknown>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(body: Body, campo: string, etiqueta: string, maxLength: number): string {
  const valor = body[campo];
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new HttpError(400, `${etiqueta} es requerido`);
  }
  const recortado = valor.trim();
  if (recortado.length > maxLength) {
    throw new HttpError(400, `${etiqueta} no puede exceder ${maxLength} caracteres`);
  }
  return recortado;
}

function optionalString(body: Body, campo: string, maxLength: number, etiqueta: string): string | null {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  if (typeof valor !== 'string') {
    throw new HttpError(400, `${etiqueta} es invalido`);
  }
  const recortado = valor.trim();
  if (recortado.length > maxLength) {
    throw new HttpError(400, `${etiqueta} no puede exceder ${maxLength} caracteres`);
  }
  return recortado || null;
}

function parsePropietario(body: Body): PropietarioInput {
  const nombre = requireString(body, 'nombre', 'El nombre', 180);
  const numeroLote = optionalString(body, 'numeroLote', 20, 'El numero de lote');
  const curp = optionalString(body, 'curp', 18, 'El CURP');
  const email = optionalString(body, 'email', 180, 'El correo electronico');
  if (email && !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'El correo electronico no tiene un formato valido');
  }
  const telefono = optionalString(body, 'telefono', 20, 'El telefono');

  return {
    nombre,
    numeroLote,
    curp: curp ? curp.toUpperCase() : null,
    email: email ? email.toLowerCase() : null,
    telefono,
  };
}

export function parseCrearDocumentoPersonalInput(body: unknown): CrearDocumentoPersonalInput {
  const b = (body ?? {}) as Body;
  const empresaId = Number(b.empresaId);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'La empresa es invalida');
  }
  return { empresaId, ...parsePropietario(b) };
}

export function parseActualizarDocumentoPersonalInput(body: unknown): PropietarioInput {
  return parsePropietario((body ?? {}) as Body);
}

export function parseCampoDocumentoPersonal(valor: string | undefined): CampoDocumentoPersonal {
  if (!valor || !(valor in CAMPO_COLUMNA)) {
    throw new HttpError(400, 'El campo de documento es invalido');
  }
  return valor as CampoDocumentoPersonal;
}
