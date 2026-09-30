import type { PropietarioDTO } from '../propietarios/propietarios.types';

export type CampoFiel = 'clavePrivada' | 'certificado';

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

export interface FielRegistroDTO {
  id: number;
  propietarioId: number;
  propietario: PropietarioDTO;
  clavePrivadaId: number | null;
  clavePrivadaDoc: DocumentoDTO | null;
  certificadoId: number | null;
  certificadoDoc: DocumentoDTO | null;
  contrasena: string | null;
  fechaCreacion: string | null;
  fechaVencimiento: string | null;
}

export interface CrearFielInput {
  empresaId: number;
  propietarioId: number;
  fechaCreacion: string | null;
  fechaVencimiento: string | null;
}

export interface ActualizarFielInput {
  propietarioId: number;
  fechaCreacion: string | null;
  fechaVencimiento: string | null;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
