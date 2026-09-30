export type CampoFacturaHl = 'comprobante';

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

export interface FacturaHlDTO {
  id: number;
  cliente: string;
  fecha: string;
  comprobanteId: number | null;
  comprobanteDoc: DocumentoDTO | null;
}

export interface CrearFacturaHlInput {
  cliente: string;
  fecha: string;
}

export interface ActualizarFacturaHlInput {
  cliente: string;
  fecha: string;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
