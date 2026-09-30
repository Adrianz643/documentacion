import { HttpError } from '../../utils/httpError';
import type { ActualizarPerfilPropioInput, ActualizarUsuarioInput, CrearUsuarioInput, PersonaInput } from './usuarios.types';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const SUBROLES_VALIDOS = new Set(['ARDUM', 'ARDUM_HL', 'EMPRESAS_CHINAS']);

type Body = Record<string, unknown>;

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

function requireId(body: Body, campo: string, etiqueta: string): number {
  const numero = Number(body[campo]);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new HttpError(400, `${etiqueta} es invalido`);
  }
  return numero;
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

function parsePersona(body: Body): PersonaInput {
  const nombre = requireString(body, 'nombre', 'El nombre', 100);
  const apellidoPaterno = requireString(body, 'apellidoPaterno', 'El apellido paterno', 100);
  const apellidoMaterno = requireString(body, 'apellidoMaterno', 'El apellido materno', 100);
  const tipoDocumentoId = requireId(body, 'tipoDocumentoId', 'El tipo de documento');
  const paisId = requireId(body, 'paisId', 'El pais');

  const fechaNacimiento = requireString(body, 'fechaNacimiento', 'La fecha de nacimiento', 10);
  const fechaParseada = Date.parse(fechaNacimiento);
  if (Number.isNaN(fechaParseada) || fechaParseada > Date.now()) {
    throw new HttpError(400, 'La fecha de nacimiento no es valida');
  }

  const curp = requireString(body, 'curp', 'El CURP', 18).toUpperCase();
  if (curp.length !== 18 || !CURP_REGEX.test(curp)) {
    throw new HttpError(400, 'El CURP no tiene un formato valido');
  }

  const email = requireString(body, 'email', 'El correo electronico', 255).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'El correo electronico no tiene un formato valido');
  }

  const rfc = optionalString(body, 'rfc', 13, 'El RFC');
  if (rfc && !RFC_REGEX.test(rfc.toUpperCase())) {
    throw new HttpError(400, 'El RFC no tiene un formato valido');
  }

  const telefono = optionalString(body, 'telefono', 20, 'El telefono');

  return {
    tipoDocumentoId,
    paisId,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    fechaNacimiento,
    curp,
    rfc: rfc ? rfc.toUpperCase() : null,
    email,
    telefono,
  };
}

function parseSubroles(body: Body): string[] {
  const valor = body.subroles;
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    throw new HttpError(400, 'Los subroles deben ser una lista');
  }
  const claves = valor.map((v) => String(v).trim().toUpperCase());
  for (const clave of claves) {
    if (!SUBROLES_VALIDOS.has(clave)) {
      throw new HttpError(400, `Subrol invalido: ${clave}`);
    }
  }
  return Array.from(new Set(claves));
}

function parsePersonaBody(body: Body): PersonaInput {
  const persona = body.persona;
  if (!persona || typeof persona !== 'object') {
    throw new HttpError(400, 'Los datos de persona son requeridos');
  }
  return parsePersona(persona as Body);
}

export function parseCrearUsuarioInput(body: unknown): CrearUsuarioInput {
  const b = (body ?? {}) as Body;
  const username = requireString(b, 'username', 'El usuario', 50);

  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }

  const rolId = requireId(b, 'rolId', 'El rol');
  const estadoId = requireId(b, 'estadoId', 'El estado');
  const persona = parsePersonaBody(b);
  const subroles = parseSubroles(b);

  return { username, password, rolId, estadoId, persona, subroles };
}

export function parseActualizarUsuarioInput(body: unknown): ActualizarUsuarioInput {
  const b = (body ?? {}) as Body;
  const username = requireString(b, 'username', 'El usuario', 50);
  const rolId = requireId(b, 'rolId', 'El rol');
  const estadoId = requireId(b, 'estadoId', 'El estado');
  const persona = parsePersonaBody(b);
  const subroles = parseSubroles(b);

  let password: string | null = null;
  if (typeof b.password === 'string' && b.password.length > 0) {
    if (b.password.length < PASSWORD_MIN_LENGTH) {
      throw new HttpError(400, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }
    password = b.password;
  }

  return { username, password, rolId, estadoId, persona, subroles };
}

export function parseActualizarPerfilPropioInput(body: unknown): ActualizarPerfilPropioInput {
  const b = (body ?? {}) as Body;
  const username = requireString(b, 'username', 'El usuario', 50);
  const persona = parsePersonaBody(b);

  let password: string | null = null;
  if (typeof b.password === 'string' && b.password.length > 0) {
    if (b.password.length < PASSWORD_MIN_LENGTH) {
      throw new HttpError(400, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }
    password = b.password;
  }

  return { username, password, persona };
}
