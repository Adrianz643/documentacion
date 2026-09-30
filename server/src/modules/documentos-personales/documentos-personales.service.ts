import { HttpError } from '../../utils/httpError';
import { guardarArchivo } from '../../utils/fileStorage';
import type { DocumentoPersonalRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as repository from './documentos-personales.repository';
import type {
  ArchivoSubidoInput,
  CampoDocumentoPersonal,
  CrearDocumentoPersonalInput,
  DocumentoDTO,
  DocumentoPersonalDTO,
  PropietarioInput,
} from './documentos-personales.types';

const SUBCARPETA = 'documentos-personales';

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
    id,
    empresaId,
    propietarioId,
    tipoDocumentoId,
    nombreArchivo: nombre,
    rutaStorage: ruta,
    mimeType: mime,
    tamanoByes: tam,
    subidoPor,
    createdAt: creado.toISOString(),
  };
}

function mapRowToDTO(row: DocumentoPersonalRow, empresaId: number): DocumentoPersonalDTO {
  return {
    id: row.id,
    propietario: {
      id: row.propietario_id,
      empresaId,
      nombre: row.propietario_nombre,
      numeroLote: row.propietario_numero_lote,
      curp: row.propietario_curp,
      email: row.propietario_email,
      telefono: row.propietario_telefono,
      activo: row.propietario_activo === 1,
      createdAt: row.propietario_created_at.toISOString(),
      updatedAt: row.propietario_updated_at.toISOString(),
    },
    contratoArdumId: row.contrato_ardum_id,
    contratoArdumDoc: mapDocumento(
      row.contrato_ardum_id, row.contrato_ardum_tipo_id, row.contrato_ardum_nombre, row.contrato_ardum_ruta,
      row.contrato_ardum_mime, row.contrato_ardum_tam, row.contrato_ardum_subido_por, row.contrato_ardum_creado,
      empresaId, row.propietario_id,
    ),
    contratoHegewischId: row.contrato_hegewisch_id,
    contratoHegewischDoc: mapDocumento(
      row.contrato_hegewisch_id, row.contrato_hegewisch_tipo_id, row.contrato_hegewisch_nombre,
      row.contrato_hegewisch_ruta, row.contrato_hegewisch_mime, row.contrato_hegewisch_tam,
      row.contrato_hegewisch_subido_por, row.contrato_hegewisch_creado, empresaId, row.propietario_id,
    ),
    csfId: row.csf_id,
    csfDoc: mapDocumento(
      row.csf_id, row.csf_tipo_id, row.csf_nombre, row.csf_ruta, row.csf_mime, row.csf_tam,
      row.csf_subido_por, row.csf_creado, empresaId, row.propietario_id,
    ),
    acuseCitaId: row.acuse_cita_id,
    acuseCitaDoc: mapDocumento(
      row.acuse_cita_id, row.acuse_cita_tipo_id, row.acuse_cita_nombre, row.acuse_cita_ruta, row.acuse_cita_mime,
      row.acuse_cita_tam, row.acuse_cita_subido_por, row.acuse_cita_creado, empresaId, row.propietario_id,
    ),
  };
}

export async function listar(empresaId: number): Promise<DocumentoPersonalDTO[]> {
  const rows = await repository.findListadoByEmpresa(empresaId);
  return rows.map((row) => mapRowToDTO(row, empresaId));
}

export async function obtenerDetalle(id: number, empresaId: number): Promise<DocumentoPersonalDTO> {
  const row = await repository.findDetalleById(id);
  if (!row) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return mapRowToDTO(row, empresaId);
}

export async function crear(input: CrearDocumentoPersonalInput, actorId: number): Promise<DocumentoPersonalDTO> {
  const id = await repository.crear(input, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DOCUMENTOS_PERSONALES',
    accion: 'crear',
    descripcion: `Creó el expediente personal de ${input.nombre}`,
    referenciaTabla: 'documentos_personales',
    referenciaId: id,
  });
  return obtenerDetalle(id, input.empresaId);
}

export async function actualizar(
  id: number,
  empresaId: number,
  input: PropietarioInput,
  actorId: number,
): Promise<DocumentoPersonalDTO> {
  await obtenerDetalle(id, empresaId);
  await repository.actualizarPropietario(id, input, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DOCUMENTOS_PERSONALES',
    accion: 'editar',
    descripcion: `Actualizó el expediente personal de ${input.nombre}`,
    referenciaTabla: 'documentos_personales',
    referenciaId: id,
  });
  return obtenerDetalle(id, empresaId);
}

export async function eliminar(id: number, empresaId: number, actorId: number): Promise<void> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DOCUMENTOS_PERSONALES',
    accion: 'eliminar',
    descripcion: `Eliminó el expediente personal de ${actual.propietario.nombre}`,
    referenciaTabla: 'documentos_personales',
    referenciaId: id,
  });
}

export async function subirDocumento(
  id: number,
  empresaId: number,
  campo: CampoDocumentoPersonal,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<DocumentoPersonalDTO> {
  const actual = await obtenerDetalle(id, empresaId);
  const tipoDocumentoId = await repository.findTipoDocumentoIdByClave(repository.CAMPO_TIPO_CLAVE[campo]);
  if (!tipoDocumentoId) {
    throw new HttpError(500, 'El tipo de documento no esta configurado');
  }

  const guardado = await guardarArchivo(SUBCARPETA, archivo);
  // No se borra el archivo fisico anterior aqui: el documento reemplazado solo se marca como
  // borrado logico (repository.reemplazarDocumentoSlot ya le puso deleted_at) y aparece en
  // Papelera; el archivo fisico solo se destruye cuando se purga desde ahi (definitivo o a
  // los 30 dias), para que "Restaurar" siempre tenga bytes reales que recuperar.
  await repository.reemplazarDocumentoSlot(id, campo, {
    empresaId,
    propietarioId: actual.propietario.id,
    tipoDocumentoId,
    nombreArchivo: guardado.nombreArchivo,
    rutaStorage: guardado.rutaStorage,
    mimeType: guardado.mimeType,
    tamanoBytes: guardado.tamanoBytes,
    subidoPor: actorId,
  });

  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DOCUMENTOS_PERSONALES',
    accion: 'subir',
    descripcion: `Subió el documento "${campo}" de ${actual.propietario.nombre}`,
    referenciaTabla: 'documentos_personales',
    referenciaId: id,
  });

  return obtenerDetalle(id, empresaId);
}

export async function eliminarDocumento(
  id: number,
  empresaId: number,
  campo: CampoDocumentoPersonal,
  actorId: number,
): Promise<DocumentoPersonalDTO> {
  const actual = await obtenerDetalle(id, empresaId);
  // Igual que arriba: solo se marca deleted_at (repository.quitarDocumentoSlot), el archivo
  // fisico se conserva hasta que se purgue desde Papelera.
  await repository.quitarDocumentoSlot(id, campo, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DOCUMENTOS_PERSONALES',
    accion: 'eliminar',
    descripcion: `Eliminó el documento "${campo}" de ${actual.propietario.nombre}`,
    referenciaTabla: 'documentos_personales',
    referenciaId: id,
  });
  return obtenerDetalle(id, empresaId);
}
