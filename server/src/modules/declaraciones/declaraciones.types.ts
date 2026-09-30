import type { PropietarioDTO } from '../propietarios/propietarios.types';

export type CampoDeclaracion = 'comprobante';
export type TipoDeclaracion = 'mensual' | 'mensual_cero';
export type FrecuenciaPago = 'mensual' | 'bimestral' | 'anual';

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

export interface DeclaracionDTO {
  id: number;
  propietarioId: number;
  propietario: PropietarioDTO;
  tipo: TipoDeclaracion;
  siguientePagoFrecuencia: FrecuenciaPago;
  fechaUltimoPago: string | null;
  fechaDeclaracion: string | null;
  comprobanteId: number | null;
  comprobanteDoc: DocumentoDTO | null;
  periodoMes: number;
  periodoAnio: number;
}

export interface CrearDeclaracionInput {
  empresaId: number;
  propietarioId: number;
  tipo: TipoDeclaracion;
  siguientePagoFrecuencia: FrecuenciaPago;
  fechaUltimoPago: string | null;
  fechaDeclaracion: string | null;
}

export interface ActualizarDeclaracionInput {
  propietarioId: number;
  siguientePagoFrecuencia: FrecuenciaPago;
  fechaUltimoPago: string | null;
  fechaDeclaracion: string | null;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
