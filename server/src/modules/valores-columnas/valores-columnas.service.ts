import { HttpError } from '../../utils/httpError';
import { guardarArchivo as almacenarArchivo } from '../../utils/fileStorage';
import { insertarDocumentoGenerico } from '../../utils/documentos';
import type { ColumnaPersonalizadaRow } from '../../types/db.types';
import * as columnasRepository from '../columnas-personalizadas/columnas-personalizadas.repository';
import * as repository from './valores-columnas.repository';
import type { ArchivoSubidoInput, DocumentoDTO, ValorColumnaDTO } from './valores-columnas.types';

const SUBCARPETA = 'columnas-personalizadas';
const TIPO_DOCUMENTO_CLAVE = 'COMPROBANTE';
const MAX_TEXTO = 2000;

function mapRow(row: repository.ValorColumnaRow, empresaId: number): ValorColumnaDTO {
  const tieneDocumento = row.valor_documento_id && row.doc_tipo_id && row.doc_nombre && row.doc_ruta && row.doc_mime
    && row.doc_tam !== null && row.doc_subido_por && row.doc_creado;
  const documento: DocumentoDTO | null = tieneDocumento
    ? {
      id: row.valor_documento_id!,
      empresaId,
      propietarioId: null,
      tipoDocumentoId: row.doc_tipo_id!,
      nombreArchivo: row.doc_nombre!,
      rutaStorage: row.doc_ruta!,
      mimeType: row.doc_mime!,
      tamanoByes: row.doc_tam!,
      subidoPor: row.doc_subido_por!,
      createdAt: row.doc_creado!.toISOString(),
    }
    : null;

  return {
    columnaId: row.columna_id,
    registroId: row.registro_id,
    valorTexto: row.valor_texto,
    documento,
  };
}

function validarTexto(tipo: ColumnaPersonalizadaRow['tipo'], valor: string): void {
  if (!valor || valor.length > MAX_TEXTO) {
    throw new HttpError(400, 'El valor es requerido y no puede exceder 2000 caracteres');
  }
  if (tipo === 'numero' && !Number.isFinite(Number(valor))) {
    throw new HttpError(400, 'El valor debe ser un numero');
  }
  if (tipo === 'fecha' && (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor)))) {
    throw new HttpError(400, 'El valor debe ser una fecha valida');
  }
  if (tipo === 'boolean' && valor !== 'Sí' && valor !== 'No') {
    throw new HttpError(400, 'El valor debe ser Sí o No');
  }
}

async function obtenerColumna(columnaId: number, registroId: number): Promise<ColumnaPersonalizadaRow> {
  const columna = await columnasRepository.findById(columnaId);
  if (!columna) {
    throw new HttpError(404, 'Columna no encontrada');
  }
  if (!repository.seccionSoportada(columna.seccion)) {
    throw new HttpError(400, 'La seccion de la columna no admite valores');
  }
  if (!(await repository.existeRegistro(columna.seccion, registroId))) {
    throw new HttpError(404, 'Registro no encontrado');
  }
  return columna;
}

export async function obtenerEmpresaIdDeColumna(columnaId: number): Promise<number | null> {
  const columna = await columnasRepository.findById(columnaId);
  return columna?.empresa_id ?? null;
}

export async function listar(empresaId: number, seccion: string): Promise<ValorColumnaDTO[]> {
  if (!repository.seccionSoportada(seccion)) {
    throw new HttpError(400, 'La seccion no admite valores');
  }
  const rows = await repository.findPorEmpresaSeccion(empresaId, seccion);
  return rows.map((row) => mapRow(row, empresaId));
}

async function releer(columnaId: number, registroId: number, empresaId: number): Promise<ValorColumnaDTO | null> {
  const row = await repository.findUno(columnaId, registroId);
  return row ? mapRow(row, empresaId) : null;
}

export async function guardarTexto(
  columnaId: number,
  registroId: number,
  valor: string,
  actorId: number,
): Promise<ValorColumnaDTO | null> {
  const columna = await obtenerColumna(columnaId, registroId);
  if (columna.tipo === 'archivo') {
    throw new HttpError(400, 'Esta columna requiere un archivo');
  }
  const limpio = valor.trim();
  validarTexto(columna.tipo, limpio);
  await repository.upsertTexto(columnaId, registroId, limpio, actorId);
  return releer(columnaId, registroId, columna.empresa_id);
}

export async function guardarDocumento(
  columnaId: number,
  registroId: number,
  archivo: ArchivoSubidoInput,
  actorId: number,
): Promise<ValorColumnaDTO | null> {
  const columna = await obtenerColumna(columnaId, registroId);
  if (columna.tipo !== 'archivo') {
    throw new HttpError(400, 'Esta columna no admite archivos');
  }
  const tipoDocumentoId = await repository.findTipoDocumentoIdByClave(TIPO_DOCUMENTO_CLAVE);
  if (!tipoDocumentoId) {
    throw new HttpError(500, 'El tipo de documento no esta configurado');
  }

  const guardado = await almacenarArchivo(SUBCARPETA, archivo);
  const documentoId = await insertarDocumentoGenerico({
    empresaId: columna.empresa_id,
    propietarioId: null,
    tipoDocumentoId,
    nombreArchivo: guardado.nombreArchivo,
    rutaStorage: guardado.rutaStorage,
    mimeType: guardado.mimeType,
    tamanoBytes: guardado.tamanoBytes,
    subidoPor: actorId,
  });
  await repository.upsertDocumento(columnaId, registroId, documentoId, actorId);
  return releer(columnaId, registroId, columna.empresa_id);
}

export async function quitar(columnaId: number, registroId: number, actorId: number): Promise<void> {
  await obtenerColumna(columnaId, registroId);
  await repository.eliminarValor(columnaId, registroId, actorId);
}
