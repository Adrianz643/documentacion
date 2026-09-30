import { HttpError } from '../../utils/httpError';
import { mapDuplicateKeyError } from '../../utils/dbErrors';
import { guardarArchivo } from '../../utils/fileStorage';
import { decryptSecret, encryptSecret } from '../../utils/crypto';
import type { FielRegistroRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as propietariosRepository from '../propietarios/propietarios.repository';
import * as repository from './fiel.repository';
import type {
  ActualizarFielInput,
  ArchivoSubidoInput,
  CampoFiel,
  CrearFielInput,
  DocumentoDTO,
  FielRegistroDTO,
} from './fiel.types';

const SUBCARPETA = 'fiel';

function mapDocumento(
  id: number | null,
  tipoDocumentoId: number | null,
  nombre: string | null,
  ruta: string | null,
  mime: string | null,
  tam: number | null,
  subidoPor: number | null,
  creado: Date | null,
  empresaId: number,
  propietarioId: number,
): DocumentoDTO | null {
  if (!id || !tipoDocumentoId || !nombre || !ruta || !mime || tam === null || !subidoPor || !creado) {
    return null;
  }
  return {
    id, empresaId, propietarioId, tipoDocumentoId,
    nombreArchivo: nombre, rutaStorage: ruta, mimeType: mime,
    tamanoByes: tam, subidoPor, createdAt: creado.toISOString(),
  };
}

function mapRowToDTO(row: FielRegistroRow, empresaId: number): FielRegistroDTO {
  return {
    id: row.id,
    propietarioId: row.propietario_id,
    propietario: {
      id: row.propietario_id,
      empresaId,
      nombre: row.propietario_nombre,
      curp: row.propietario_curp,
      email: row.propietario_email,
      telefono: row.propietario_telefono,
      activo: row.propietario_activo === 1,
      createdAt: row.propietario_created_at.toISOString(),
      updatedAt: row.propietario_updated_at.toISOString(),
    },
    clavePrivadaId: row.clave_privada_id,
    clavePrivadaDoc: mapDocumento(
      row.clave_privada_id, row.clave_privada_tipo_id, row.clave_privada_nombre, row.clave_privada_ruta,
      row.clave_privada_mime, row.clave_privada_tam, row.clave_privada_subido_por, row.clave_privada_creado,
      empresaId, row.propietario_id,
    ),
    certificadoId: row.certificado_id,
    certificadoDoc: mapDocumento(
      row.certificado_id, row.certificado_tipo_id, row.certificado_nombre, row.certificado_ruta,
      row.certificado_mime, row.certificado_tam, row.certificado_subido_por, row.certificado_creado,
      empresaId, row.propietario_id,
    ),
    contrasena: row.contrasena ? decryptSecret(row.contrasena) : null,
    fechaCreacion: row.fecha_creacion ? row.fecha_creacion.toISOString().slice(0, 10) : null,
    fechaVencimiento: row.fecha_vencimiento ? row.fecha_vencimiento.toISOString().slice(0, 10) : null,
  };
}

async function validarPropietario(propietarioId: number, empresaId: number): Promise<void> {
  const propietario = await propietariosRepository.findByIdEnEmpresa(propietarioId, empresaId);
  if (!propietario) {
    throw new HttpError(400, 'El propietario seleccionado no es valido');
  }
}

export async function listar(empresaId: number): Promise<FielRegistroDTO[]> {
  const rows = await repository.findListadoByEmpresa(empresaId);
  return rows.map((row) => mapRowToDTO(row, empresaId));
}

export async function obtenerDetalle(id: number, empresaId: number): Promise<FielRegistroDTO> {
  const row = await repository.findDetalleById(id);
  if (!row) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return mapRowToDTO(row, empresaId);
}

export async function crear(input: CrearFielInput, actorId: number): Promise<FielRegistroDTO> {
  await validarPropietario(input.propietarioId, input.empresaId);
  try {
    const id = await repository.crear(input, actorId);
    const creado = await obtenerDetalle(id, input.empresaId);
    void actividadService.registrar({
      usuarioId: actorId,
      modulo: 'FIEL',
      accion: 'crear',
      descripcion: `Creó el registro FIEL de ${creado.propietario.nombre}`,
      referenciaTabla: 'fiel_registros',
      referenciaId: id,
    });
    return creado;
  } catch (error) {
    const campoDuplicado = mapDuplicateKeyError(error);
    if (campoDuplicado) {
      throw new HttpError(409, `Ya existe un registro con ese ${campoDuplicado}`);
    }
    throw error;
  }
}

export async function actualizar(
  id: number,
  empresaId: number,
  input: ActualizarFielInput,
  actorId: number,
): Promise<FielRegistroDTO> {
  await obtenerDetalle(id, empresaId);
  await validarPropietario(input.propietarioId, empresaId);
  try {
    await repository.actualizar(id, input, actorId);
  } catch (error) {
    const campoDuplicado = mapDuplicateKeyError(error);
    if (campoDuplicado) {
      throw new HttpError(409, `Ya existe un registro con ese ${campoDuplicado}`);
    }
    throw error;
  }
  const actualizado = await obtenerDetalle(id, empresaId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FIEL',
    accion: 'editar',
    descripcion: `Actualizó el registro FIEL de ${actualizado.propietario.nombre}`,
    referenciaTabla: 'fiel_registros',
    referenciaId: id,
  });
  return actualizado;
}

export async function eliminar(id: number, empresaId: number, actorId: number): Promise<void> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FIEL',
    accion: 'eliminar',
    descripcion: `Eliminó el registro FIEL de ${actual.propietario.nombre}`,
    referenciaTabla: 'fiel_registros',
    referenciaId: id,
  });
}

export async function subirDocumento(
  id: number,
  empresaId: number,
  campo: CampoFiel,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<FielRegistroDTO> {
  const actual = await obtenerDetalle(id, empresaId);
  const tipoDocumentoId = await repository.findTipoDocumentoIdByClave(repository.CAMPO_TIPO_CLAVE[campo]);
  if (!tipoDocumentoId) {
    throw new HttpError(500, 'El tipo de documento no esta configurado');
  }

  const guardado = await guardarArchivo(SUBCARPETA, archivo);
  // El archivo reemplazado solo se marca como borrado logico; el fisico se conserva hasta
  // que se purgue desde Papelera (definitivo o a los 30 dias), asi "Restaurar" es real.
  await repository.reemplazarDocumentoSlot(id, campo, {
    empresaId,
    propietarioId: actual.propietarioId,
    tipoDocumentoId,
    nombreArchivo: guardado.nombreArchivo,
    rutaStorage: guardado.rutaStorage,
    mimeType: guardado.mimeType,
    tamanoBytes: guardado.tamanoBytes,
    subidoPor: actorId,
  });

  return obtenerDetalle(id, empresaId);
}

export async function eliminarDocumento(
  id: number,
  empresaId: number,
  campo: CampoFiel,
  actorId: number,
): Promise<FielRegistroDTO> {
  await obtenerDetalle(id, empresaId);
  await repository.quitarDocumentoSlot(id, campo, actorId);
  return obtenerDetalle(id, empresaId);
}

export async function actualizarContrasena(
  id: number,
  empresaId: number,
  contrasena: string,
  actorId: number,
): Promise<FielRegistroDTO> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.actualizarContrasena(id, encryptSecret(contrasena), actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FIEL',
    accion: 'editar',
    descripcion: `Capturó la contraseña de la FIEL de ${actual.propietario.nombre}`,
    referenciaTabla: 'fiel_registros',
    referenciaId: id,
  });
  return obtenerDetalle(id, empresaId);
}

export async function eliminarContrasena(id: number, empresaId: number, actorId: number): Promise<FielRegistroDTO> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.eliminarContrasena(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FIEL',
    accion: 'eliminar',
    descripcion: `Eliminó la contraseña de la FIEL de ${actual.propietario.nombre}`,
    referenciaTabla: 'fiel_registros',
    referenciaId: id,
  });
  return obtenerDetalle(id, empresaId);
}
