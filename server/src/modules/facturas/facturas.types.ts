import type { PropietarioDTO } from '../propietarios/propietarios.types';

export type CampoFactura = 'comprobante';

export interface DocumentoDTO {
  id: number;
  empresaId: number;
  propietarioId: number | null;
  tipoDocumentoId: number;
  nombreArchivo: string;
  rutaStorage: string;
  mimeType: string;
  tamanoByes: number;
  subidoPor: number;
  createdAt: string;
}

export interface FacturaDTO {
  id: number;
  propietarioId: number;
  propietario: PropietarioDTO;
  fecha: string;
  comprobanteId: number | null;
  comprobanteDoc: DocumentoDTO | null;
}

export interface CrearFacturaInput {
  empresaId: number;
  propietarioId: number;
  fecha: string;
}

export interface ActualizarFacturaInput {
  propietarioId: number;
  fecha: string;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
