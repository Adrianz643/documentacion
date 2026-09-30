import { HttpError } from '../../utils/httpError';
import { guardarArchivo } from '../../utils/fileStorage';
import type { FacturaHlRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as repository from './facturas-hl.repository';
import type {
  ActualizarFacturaHlInput,
  ArchivoSubidoInput,
  CampoFacturaHl,
  CrearFacturaHlInput,
  DocumentoDTO,
  FacturaHlDTO,
} from './facturas-hl.types';

const SUBCARPETA = 'facturas-hl';

function mapDocumento(
  id: number | null,
  tipoDocumentoId: number | null,
  nombre: string | null,
  ruta: string | null,
  mime: string | null,
  tam: number | null,
  subidoPor: number | null,
  creado: Date | null,
): DocumentoDTO | null {
  if (!id || !tipoDocumentoId || !nombre || !ruta || !mime || tam === null || !subidoPor || !creado) {
    return null;
  }
  return {
    id, empresaId: repository.EMPRESA_HL_ID, propietarioId: null, tipoDocumentoId,
    nombreArchivo: nombre, rutaStorage: ruta, mimeType: mime,
    tamanoByes: tam, subidoPor, createdAt: creado.toISOString(),
  };
}

function mapRowToDTO(row: FacturaHlRow): FacturaHlDTO {
  return {
    id: row.id,
    cliente: row.cliente,
    fecha: row.fecha.toISOString().slice(0, 10),
    comprobanteId: row.comprobante_id,
    comprobanteDoc: mapDocumento(
      row.comprobante_id, row.comprobante_tipo_id, row.comprobante_nombre, row.comprobante_ruta,
      row.comprobante_mime, row.comprobante_tam, row.comprobante_subido_por, row.comprobante_creado,
    ),
  };
}

export async function listar(): Promise<FacturaHlDTO[]> {
  const rows = await repository.findListado();
  return rows.map(mapRowToDTO);
}

export async function obtenerDetalle(id: number): Promise<FacturaHlDTO> {
  const row = await repository.findDetalleById(id);
  if (!row) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return mapRowToDTO(row);
}

export async function crear(input: CrearFacturaHlInput, actorId: number): Promise<FacturaHlDTO> {
  const id = await repository.crear(input, actorId);
  const creada = await obtenerDetalle(id);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS_HL',
    accion: 'crear',
    descripcion: `Creó la factura HL de ${creada.cliente} (${creada.fecha})`,
    referenciaTabla: 'facturas_hl',
    referenciaId: id,
  });
  return creada;
}

export async function actualizar(id: number, input: ActualizarFacturaHlInput, actorId: number): Promise<FacturaHlDTO> {
  await obtenerDetalle(id);
  await repository.actualizar(id, input, actorId);
  const actualizada = await obtenerDetalle(id);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS_HL',
    accion: 'editar',
    descripcion: `Actualizó la factura HL de ${actualizada.cliente} (${actualizada.fecha})`,
    referenciaTabla: 'facturas_hl',
    referenciaId: id,
  });
  return actualizada;
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  const actual = await obtenerDetalle(id);
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'FACTURAS_HL',
    accion: 'eliminar',
    descripcion: `Eliminó la factura HL de ${actual.cliente} (${actual.fecha})`,
    referenciaTabla: 'facturas_hl',
    referenciaId: id,
  });
}

export async function subirDocumento(
  id: number,
  campo: CampoFacturaHl,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<FacturaHlDTO> {
  await obtenerDetalle(id);
  const tipoDocumentoId = await repository.findTipoDocumentoIdByClave(repository.CAMPO_TIPO_CLAVE[campo]);
  if (!tipoDocumentoId) {
    throw new HttpError(500, 'El tipo de documento no esta configurado');
  }

  const guardado = await guardarArchivo(SUBCARPETA, archivo);
  // El archivo reemplazado solo se marca como borrado logico; el fisico se conserva hasta
  // que se purgue desde Papelera (definitivo o a los 30 dias), asi "Restaurar" es real.
  await repository.reemplazarDocumentoSlot(id, campo, {
    tipoDocumentoId,
    nombreArchivo: guardado.nombreArchivo,
    rutaStorage: guardado.rutaStorage,
    mimeType: guardado.mimeType,
    tamanoBytes: guardado.tamanoBytes,
    subidoPor: actorId,
  });

  return obtenerDetalle(id);
}

export async function eliminarDocumento(id: number, campo: CampoFacturaHl, actorId: number): Promise<FacturaHlDTO> {
  await obtenerDetalle(id);
  await repository.quitarDocumentoSlot(id, campo, actorId);
  return obtenerDetalle(id);
}
