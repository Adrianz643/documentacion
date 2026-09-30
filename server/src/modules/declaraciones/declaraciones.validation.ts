import { HttpError } from '../../utils/httpError';
import type {
  ActualizarDeclaracionInput,
  CampoDeclaracion,
  CrearDeclaracionInput,
  FrecuenciaPago,
  TipoDeclaracion,
} from './declaraciones.types';
import { CAMPO_COLUMNA } from './declaraciones.repository';

type Body = Record<string, unknown>;

const TIPOS_VALIDOS: TipoDeclaracion[] = ['mensual', 'mensual_cero'];
const FRECUENCIAS_VALIDAS: FrecuenciaPago[] = ['mensual', 'bimestral', 'anual'];

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

function parseFrecuencia(body: Body): FrecuenciaPago {
  const valor = body.siguientePagoFrecuencia;
  if (typeof valor !== 'string' || !FRECUENCIAS_VALIDAS.includes(valor as FrecuenciaPago)) {
    throw new HttpError(400, 'La frecuencia de pago es invalida');
  }
  return valor as FrecuenciaPago;
}

export function parseCrearDeclaracionInput(body: unknown): CrearDeclaracionInput {
  const b = (body ?? {}) as Body;
  const empresaId = requireId(b, 'empresaId', 'La empresa');
  const propietarioId = requireId(b, 'propietarioId', 'El propietario');

  const tipo = b.tipo;
  if (typeof tipo !== 'string' || !TIPOS_VALIDOS.includes(tipo as TipoDeclaracion)) {
    throw new HttpError(400, 'El tipo de declaracion es invalido');
  }

  return {
    empresaId,
    propietarioId,
    tipo: tipo as TipoDeclaracion,
    siguientePagoFrecuencia: parseFrecuencia(b),
    fechaUltimoPago: parseFecha(b, 'fechaUltimoPago', 'La fecha del ultimo pago'),
    fechaDeclaracion: parseFecha(b, 'fechaDeclaracion', 'La fecha de declaracion'),
  };
}

export function parseActualizarDeclaracionInput(body: unknown): ActualizarDeclaracionInput {
  const b = (body ?? {}) as Body;
  return {
    propietarioId: requireId(b, 'propietarioId', 'El propietario'),
    siguientePagoFrecuencia: parseFrecuencia(b),
    fechaUltimoPago: parseFecha(b, 'fechaUltimoPago', 'La fecha del ultimo pago'),
    fechaDeclaracion: parseFecha(b, 'fechaDeclaracion', 'La fecha de declaracion'),
  };
}

export function parseCampoDeclaracion(valor: string | undefined): CampoDeclaracion {
  if (!valor || !(valor in CAMPO_COLUMNA)) {
    throw new HttpError(400, 'El campo de documento es invalido');
  }
  return valor as CampoDeclaracion;
}

export function parseEmpresaIdQuery(value: unknown): number {
  const empresaId = Number(value);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  return empresaId;
}
