import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { HttpError } from '../../utils/httpError';
import { mapDuplicateKeyError } from '../../utils/dbErrors';
import type { UsuarioDetalleRow, UsuarioListadoRow, UsuarioPerfilRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as aparienciaRepository from '../apariencia/apariencia.repository';
import * as usuariosRepository from './usuarios.repository';
import type {
  ActualizarPerfilPropioInput,
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  ListarUsuariosQuery,
  PaginatedResult,
  UsuarioDetalleDTO,
  UsuarioListItemDTO,
  UsuarioPerfilDTO,
} from './usuarios.types';

const ESTADO_ACTIVO = 'ACTIVO';
const BCRYPT_ROUNDS = 10;
const PER_PAGE_MAXIMO = 100;
const ROLES_RESTRINGIDOS = new Set(['admin', 'superadmin']);
const ROL_SUPERADMIN = 'superadmin';
const ROL_VISOR = 'visor';
const ROLES_CON_SUBROL = new Set(['editor', 'visor']);
const SUBROLES_VISOR_PERMITIDOS = new Set(['ARDUM', 'EMPRESAS_CHINAS']);

async function verificarAsignacionRol(rolId: number, actorRol: string): Promise<void> {
  if (actorRol.toLowerCase() === ROL_SUPERADMIN) {
    return;
  }
  const rolNombre = await usuariosRepository.findRolNombreById(rolId);
  if (rolNombre && ROLES_RESTRINGIDOS.has(rolNombre.toLowerCase())) {
    throw new HttpError(403, 'Solo un superadministrador puede asignar el rol de administrador');
  }
}

// Los subroles (ARDUM/ARDUM HL/Empresas Chinas) solo aplican a editor/visor: admin y
// superadmin siempre tienen acceso total y no persisten filas en usuario_subroles. El
// visor es de una sola empresa a la vez (ARDUM o Empresas Chinas, nunca ARDUM HL); el
// editor puede combinar varias.
async function resolverSubrolIdsParaGuardar(rolId: number, subrolesClaves: string[]): Promise<number[]> {
  const rolNombre = await usuariosRepository.findRolNombreById(rolId);
  const requiereSubrol = !!rolNombre && ROLES_CON_SUBROL.has(rolNombre.toLowerCase());
  if (!requiereSubrol) {
    return [];
  }

  if (rolNombre!.toLowerCase() === ROL_VISOR) {
    const [unicaClave] = subrolesClaves;
    if (subrolesClaves.length !== 1 || !unicaClave || !SUBROLES_VISOR_PERMITIDOS.has(unicaClave)) {
      throw new HttpError(400, 'Selecciona una unica empresa (ARDUM o Empresas Chinas) para el rol visor');
    }
    return usuariosRepository.findSubrolIdsPorClaves(subrolesClaves);
  }

  if (subrolesClaves.length === 0) {
    throw new HttpError(400, 'Selecciona al menos un subrol (ARDUM, ARDUM HL o Empresas Chinas) para este rol');
  }
  return usuariosRepository.findSubrolIdsPorClaves(subrolesClaves);
}

function mapListadoRowToDTO(row: UsuarioListadoRow, subroles: string[]): UsuarioListItemDTO {
  return {
    id: row.usuario_id,
    username: row.username,
    persona: {
      id: row.persona_id,
      nombre: row.persona_nombre,
      apellidoPaterno: row.persona_apellido_paterno,
      apellidoMaterno: row.persona_apellido_materno,
      email: row.persona_email,
    },
    rol: { id: row.rol_id, nombre: row.rol_nombre },
    estado: { id: row.estado_id, clave: row.estado_clave, nombre: row.estado_nombre },
    ultimoLogin: row.ultimo_login,
    subroles,
  };
}

function mapDetalleRowToDTO(row: UsuarioDetalleRow, subroles: string[]): UsuarioDetalleDTO {
  return {
    id: row.usuario_id,
    username: row.username,
    rol: { id: row.rol_id, nombre: row.rol_nombre },
    estado: { id: row.estado_id, clave: row.estado_clave, nombre: row.estado_nombre },
    ultimoLogin: row.ultimo_login,
    persona: {
      id: row.persona_id,
      tipoDocumentoId: row.tipo_documento_id,
      paisId: row.pais_id,
      nombre: row.persona_nombre,
      apellidoPaterno: row.persona_apellido_paterno,
      apellidoMaterno: row.persona_apellido_materno,
      fechaNacimiento: new Date(row.fecha_nacimiento).toISOString().slice(0, 10),
      curp: row.curp,
      rfc: row.rfc,
      email: row.persona_email,
      telefono: row.telefono,
    },
    subroles,
  };
}

function mapPerfilRowToDTO(
  row: UsuarioPerfilRow,
  permisos: string[],
  subroles: string[],
  modoOscuro: boolean,
): UsuarioPerfilDTO {
  return {
    id: row.usuario_id,
    username: row.username,
    persona: {
      id: row.persona_id,
      nombre: row.persona_nombre,
      apellidoPaterno: row.persona_apellido_paterno,
      apellidoMaterno: row.persona_apellido_materno,
      email: row.persona_email,
    },
    rol: { id: row.rol_id, nombre: row.rol_nombre },
    ultimoLogin: row.ultimo_login,
    permisos,
    subroles,
    modoOscuro,
  };
}

export async function obtenerPerfilActual(usuarioId: number): Promise<UsuarioPerfilDTO> {
  const usuario = await usuariosRepository.findPerfilById(usuarioId);

  if (!usuario || usuario.estado_clave !== ESTADO_ACTIVO) {
    throw new HttpError(401, 'La sesion ya no es valida');
  }

  const [permisos, subroles, modoOscuro] = await Promise.all([
    usuariosRepository.findPermisosByRol(usuario.rol_id),
    usuariosRepository.findSubrolesPorUsuario(usuarioId),
    aparienciaRepository.findModoOscuroByUsuarioId(usuarioId),
  ]);

  return mapPerfilRowToDTO(usuario, permisos, subroles, modoOscuro);
}

export async function actualizarPerfilPropio(
  usuarioId: number,
  input: ActualizarPerfilPropioInput,
  actorId: number,
): Promise<UsuarioPerfilDTO> {
  const existente = await usuariosRepository.findDetalleById(usuarioId);
  if (!existente) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    await usuariosRepository.actualizarPersona(connection, existente.persona_id, {
      ...input.persona,
      modificadoPor: actorId,
    });

    // El rol y el estado nunca se tocan aqui: este endpoint es autoservicio, no administra
    // permisos ni el estado de la cuenta, solo los datos propios del usuario.
    const passwordHash = input.password ? await bcrypt.hash(input.password, BCRYPT_ROUNDS) : null;
    await usuariosRepository.actualizarUsuario(connection, usuarioId, {
      username: input.username,
      rolId: existente.rol_id,
      estadoId: existente.estado_id,
      passwordHash,
      modificadoPor: actorId,
    });

    await connection.commit();
    committed = true;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    const campoDuplicado = mapDuplicateKeyError(error);
    if (campoDuplicado) {
      throw new HttpError(409, `Ya existe un registro con ese ${campoDuplicado}`);
    }
    throw error;
  } finally {
    connection.release();
  }

  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'USUARIOS',
    accion: 'editar',
    descripcion: 'Actualizó su propio perfil',
    referenciaTabla: 'usuarios',
    referenciaId: usuarioId,
  });

  return obtenerPerfilActual(usuarioId);
}

export async function listar(query: ListarUsuariosQuery): Promise<PaginatedResult<UsuarioListItemDTO>> {
  const page = Math.max(1, Math.trunc(Number(query.page)) || 1);
  const perPage = Math.min(PER_PAGE_MAXIMO, Math.max(1, Math.trunc(Number(query.perPage)) || 25));
  const search = (query.search ?? '').trim();

  const [rows, total] = await Promise.all([
    usuariosRepository.findListado({ page, perPage, search }),
    usuariosRepository.contarListado({ search }),
  ]);

  const subrolesPorUsuario = await usuariosRepository.findSubrolesPorUsuarios(rows.map((row) => row.usuario_id));

  return {
    data: rows.map((row) => mapListadoRowToDTO(row, subrolesPorUsuario.get(row.usuario_id) ?? [])),
    total,
    page,
    perPage,
  };
}

export async function obtenerDetalle(usuarioId: number): Promise<UsuarioDetalleDTO> {
  const row = await usuariosRepository.findDetalleById(usuarioId);
  if (!row) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  const subroles = await usuariosRepository.findSubrolesPorUsuario(usuarioId);
  return mapDetalleRowToDTO(row, subroles);
}

export async function crear(
  input: CrearUsuarioInput,
  actorId: number,
  actorRol: string,
): Promise<UsuarioDetalleDTO> {
  await verificarAsignacionRol(input.rolId, actorRol);
  const subrolIds = await resolverSubrolIdsParaGuardar(input.rolId, input.subroles);

  const connection = await pool.getConnection();
  let committed = false;
  let usuarioId: number;

  try {
    await connection.beginTransaction();

    const personaId = await usuariosRepository.crearPersona(connection, {
      ...input.persona,
      creadoPor: actorId,
    });

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    usuarioId = await usuariosRepository.crearUsuario(connection, {
      personaId,
      rolId: input.rolId,
      estadoId: input.estadoId,
      username: input.username,
      passwordHash,
      creadoPor: actorId,
    });

    await usuariosRepository.reemplazarSubrolesUsuario(connection, usuarioId, subrolIds, actorId);

    await connection.commit();
    committed = true;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    const campoDuplicado = mapDuplicateKeyError(error);
    if (campoDuplicado) {
      throw new HttpError(409, `Ya existe un registro con ese ${campoDuplicado}`);
    }
    throw error;
  } finally {
    connection.release();
  }

  const creado = await obtenerDetalle(usuarioId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'USUARIOS',
    accion: 'crear',
    descripcion: `Creó al usuario "${creado.username}"`,
    referenciaTabla: 'usuarios',
    referenciaId: usuarioId,
  });
  return creado;
}

export async function eliminar(usuarioId: number, actorId: number): Promise<void> {
  if (usuarioId === actorId) {
    throw new HttpError(400, 'No puedes eliminar tu propia cuenta');
  }
  const existente = await usuariosRepository.findDetalleById(usuarioId);
  if (!existente) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  await usuariosRepository.eliminarUsuario(usuarioId, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'USUARIOS',
    accion: 'eliminar',
    descripcion: `Eliminó al usuario "${existente.username}"`,
    referenciaTabla: 'usuarios',
    referenciaId: usuarioId,
  });
}

export async function actualizar(
  usuarioId: number,
  input: ActualizarUsuarioInput,
  actorId: number,
  actorRol: string,
): Promise<UsuarioDetalleDTO> {
  const existente = await usuariosRepository.findDetalleById(usuarioId);
  if (!existente) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  if (input.rolId !== existente.rol_id) {
    await verificarAsignacionRol(input.rolId, actorRol);
  }
  const subrolIds = await resolverSubrolIdsParaGuardar(input.rolId, input.subroles);

  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    await usuariosRepository.actualizarPersona(connection, existente.persona_id, {
      ...input.persona,
      modificadoPor: actorId,
    });

    const passwordHash = input.password ? await bcrypt.hash(input.password, BCRYPT_ROUNDS) : null;
    await usuariosRepository.actualizarUsuario(connection, usuarioId, {
      username: input.username,
      rolId: input.rolId,
      estadoId: input.estadoId,
      passwordHash,
      modificadoPor: actorId,
    });

    await usuariosRepository.reemplazarSubrolesUsuario(connection, usuarioId, subrolIds, actorId);

    await connection.commit();
    committed = true;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    const campoDuplicado = mapDuplicateKeyError(error);
    if (campoDuplicado) {
      throw new HttpError(409, `Ya existe un registro con ese ${campoDuplicado}`);
    }
    throw error;
  } finally {
    connection.release();
  }

  const actualizado = await obtenerDetalle(usuarioId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'USUARIOS',
    accion: 'editar',
    descripcion: `Actualizó al usuario "${actualizado.username}"`,
    referenciaTabla: 'usuarios',
    referenciaId: usuarioId,
  });
  return actualizado;
}
