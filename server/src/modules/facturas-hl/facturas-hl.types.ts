// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
  fechaVencimiento: string | null;
  comprobanteId: number | null;
  comprobanteDoc: DocumentoDTO | null;
}

export interface CrearFacturaHlInput {
  cliente: string;
  fecha: string;
  fechaVencimiento: string | null;
}

export interface ActualizarFacturaHlInput {
  cliente: string;
  fecha: string;
  fechaVencimiento: string | null;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
