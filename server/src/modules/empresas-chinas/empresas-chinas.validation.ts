import { HttpError } from '../../utils/httpError';
import type { CrearEmpresaChinaInput } from './empresas-chinas.types';

type Body = Record<string, unknown>;

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

export function parseEtapaNumParam(value: string | undefined): number {
  const etapaNum = Number(value);
  if (!Number.isInteger(etapaNum) || etapaNum < 1 || etapaNum > 5) {
    throw new HttpError(400, 'La etapa debe ser un numero entre 1 y 5');
  }
  return etapaNum;
}

export function parseCodigoParam(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new HttpError(400, 'El codigo de requisito es requerido');
  }
  return value;
}

export function parseIdParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id invalido');
  }
  return id;
}

export function parseCrearEmpresaChinaInput(body: unknown): CrearEmpresaChinaInput {
  const b = (body ?? {}) as Body;
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : '';
  if (!nombre || nombre.length > 180) {
    throw new HttpError(400, 'El nombre de la empresa es requerido');
  }

  const correoElectronico = optionalString(b, 'correoElectronico', 180, 'El correo electronico');
  const fechaRegistro = b.fechaRegistro;
  if (fechaRegistro !== undefined && fechaRegistro !== null && fechaRegistro !== '') {
    if (typeof fechaRegistro !== 'string' || Number.isNaN(Date.parse(fechaRegistro))) {
      throw new HttpError(400, 'La fecha de registro no es valida');
    }
  }

  return {
    nombre,
    representanteLegal: optionalString(b, 'representanteLegal', 180, 'El representante legal'),
    correoElectronico: correoElectronico ? correoElectronico.toLowerCase() : null,
    telefono: optionalString(b, 'telefono', 30, 'El telefono'),
    fechaRegistro: (fechaRegistro as string) || null,
  };
}
