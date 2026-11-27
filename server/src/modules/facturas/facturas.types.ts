// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
  fechaVencimiento: string | null;
  comprobanteId: number | null;
  comprobanteDoc: DocumentoDTO | null;
}

export interface CrearFacturaInput {
  empresaId: number;
  propietarioId: number;
  fecha: string;
  fechaVencimiento: string | null;
}

export interface ActualizarFacturaInput {
  propietarioId: number;
  fecha: string;
  fechaVencimiento: string | null;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
