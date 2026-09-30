import { HttpError } from '../../utils/httpError';
import { guardarArchivo } from '../../utils/fileStorage';
import type { DeclaracionRow } from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as propietariosRepository from '../propietarios/propietarios.repository';
import * as repository from './declaraciones.repository';
import type {
  ActualizarDeclaracionInput,
  ArchivoSubidoInput,
  CampoDeclaracion,
  CrearDeclaracionInput,
  DeclaracionDTO,
  DocumentoDTO,
} from './declaraciones.types';

const SUBCARPETA = 'declaraciones';

function toFechaISO(valor: Date | null): string | null {
  return valor ? valor.toISOString().slice(0, 10) : null;
}

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

function mapRowToDTO(row: DeclaracionRow, empresaId: number): DeclaracionDTO {
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
    tipo: row.tipo,
    siguientePagoFrecuencia: row.siguiente_pago_frecuencia,
    fechaUltimoPago: toFechaISO(row.fecha_ultimo_pago),
    fechaDeclaracion: toFechaISO(row.fecha_declaracion),
    periodoMes: row.periodo_mes,
    periodoAnio: row.periodo_anio,
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

export async function listar(empresaId: number): Promise<DeclaracionDTO[]> {
  const rows = await repository.findListadoByEmpresa(empresaId);
  return rows.map((row) => mapRowToDTO(row, empresaId));
}

export async function obtenerDetalle(id: number, empresaId: number): Promise<DeclaracionDTO> {
  const row = await repository.findDetalleById(id);
  if (!row) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return mapRowToDTO(row, empresaId);
}

export async function crear(input: CrearDeclaracionInput, actorId: number): Promise<DeclaracionDTO> {
  await validarPropietario(input.propietarioId, input.empresaId);
  const id = await repository.crear(input, actorId);
  const creada = await obtenerDetalle(id, input.empresaId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DECLARACIONES',
    accion: 'crear',
    descripcion: `Creó la declaración de ${creada.propietario.nombre} (${creada.periodoMes}/${creada.periodoAnio})`,
    referenciaTabla: 'declaraciones',
    referenciaId: id,
  });
  return creada;
}

export async function actualizar(
  id: number,
  empresaId: number,
  input: ActualizarDeclaracionInput,
  actorId: number,
): Promise<DeclaracionDTO> {
  await obtenerDetalle(id, empresaId);
  await validarPropietario(input.propietarioId, empresaId);
  await repository.actualizar(id, input, actorId);
  const actualizada = await obtenerDetalle(id, empresaId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DECLARACIONES',
    accion: 'editar',
    descripcion: `Actualizó la declaración de ${actualizada.propietario.nombre} (${actualizada.periodoMes}/${actualizada.periodoAnio})`,
    referenciaTabla: 'declaraciones',
    referenciaId: id,
  });
  return actualizada;
}

export async function eliminar(id: number, empresaId: number, actorId: number): Promise<void> {
  const actual = await obtenerDetalle(id, empresaId);
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'DECLARACIONES',
    accion: 'eliminar',
    descripcion: `Eliminó la declaración de ${actual.propietario.nombre} (${actual.periodoMes}/${actual.periodoAnio})`,
    referenciaTabla: 'declaraciones',
    referenciaId: id,
  });
}

export async function subirDocumento(
  id: number,
  empresaId: number,
  campo: CampoDeclaracion,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<DeclaracionDTO> {
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
  campo: CampoDeclaracion,
  actorId: number,
): Promise<DeclaracionDTO> {
  await obtenerDetalle(id, empresaId);
  await repository.quitarDocumentoSlot(id, campo, actorId);
  return obtenerDetalle(id, empresaId);
}
