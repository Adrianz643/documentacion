import { HttpError } from '../../utils/httpError';
import { guardarArchivo } from '../../utils/fileStorage';
import type { FacturaRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as propietariosRepository from '../propietarios/propietarios.repository';
import * as repository from './facturas.repository';
import type {
  ActualizarFacturaInput,
  ArchivoSubidoInput,
  CampoFactura,
  CrearFacturaInput,
  DocumentoDTO,
  FacturaDTO,
} from './facturas.types';

const SUBCARPETA = 'facturas';

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

function mapRowToDTO(row: FacturaRow, empresaId: number): FacturaDTO {
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
    fecha: row.fecha.toISOString().slice(0, 10),
    comprobanteId: row.comprobante_id,
    comprobanteDoc: mapDocumento(
      row.comprobante_id, row.comprobante_tipo_id, row.comprobante_nombre, row.comprobante_ruta,
      row.comprobante_mime, row.comprobante_tam, row.comprobante_subido_por, row.comprobante_creado,
      empresaId, row.propietario_id,
    ),
  };
}

async function validarPropietario(propietarioId: number, empresaId: number): Promise<void> {
  const propietario = await propietariosRepository.findByIdEnEmpresa(propietarioId, empresaId);
  if (!propietario) {
    throw new HttpError(400, 'El propietario seleccionado no es valido');
  }
}

export async function listar(empresaId: number): Promise<FacturaDTO[]> {
  const rows = await repository.findListadoByEmpresa(empresaId);
  return rows.map((row) => mapRowToDTO(row, empresaId));
}

export async function obtenerDetalle(id: number, empresaId: number): Promise<FacturaDTO> {
  const row = await repository.findDetalleById(id);
  if (!row) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return mapRowToDTO(row, empresaId);
}

export async function crear(input: CrearFacturaInput, actorId: number): Promise<FacturaDTO> {
  await validarPropietario(input.propietarioId, input.empresaId);
  const id = await repository.crear(input, actorId);
  const creada = await obtenerDetalle(id, input.empresaId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS',
    accion: 'crear',
    descripcion: `Creó la factura de ${creada.propietario.nombre} (${creada.fecha})`,
    referenciaTabla: 'facturas',
    referenciaId: id,
  });
  return creada;
}

export async function actualizar(
  id: number,
  empresaId: number,
  input: ActualizarFacturaInput,
  actorId: number,
): Promise<FacturaDTO> {
  await obtenerDetalle(id, empresaId);
  await validarPropietario(input.propietarioId, empresaId);
  await repository.actualizar(id, input, actorId);
  const actualizada = await obtenerDetalle(id, empresaId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS',
    accion: 'editar',
    descripcion: `Actualizó la factura de ${actualizada.propietario.nombre} (${actualizada.fecha})`,
    referenciaTabla: 'facturas',
    referenciaId: id,
  });
  return actualizada;
}

export async function eliminar(id: number, empresaId: number, actorId: number): Promise<void> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS',
    accion: 'eliminar',
    descripcion: `Eliminó la factura de ${actual.propietario.nombre} (${actual.fecha})`,
    referenciaTabla: 'facturas',
    referenciaId: id,
  });
}

export async function subirDocumento(
  id: number,
  empresaId: number,
  campo: CampoFactura,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<FacturaDTO> {
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
  campo: CampoFactura,
  actorId: number,
): Promise<FacturaDTO> {
  await obtenerDetalle(id, empresaId);
  await repository.quitarDocumentoSlot(id, campo, actorId);
  return obtenerDetalle(id, empresaId);
}
