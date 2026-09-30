export type CampoDocumentoPersonal = 'contratoArdum' | 'contratoHegewisch' | 'csf' | 'acuseCita';

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

export interface PropietarioDTO {
  id: number;
  empresaId: number;
  nombre: string;
  numeroLote: string | null;
  curp: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentoPersonalDTO {
  id: number;
  propietario: PropietarioDTO;
  contratoArdumId: number | null;
  contratoArdumDoc: DocumentoDTO | null;
  contratoHegewischId: number | null;
  contratoHegewischDoc: DocumentoDTO | null;
  csfId: number | null;
  csfDoc: DocumentoDTO | null;
  acuseCitaId: number | null;
  acuseCitaDoc: DocumentoDTO | null;
}

export interface PropietarioInput {
  nombre: string;
  numeroLote: string | null;
  curp: string | null;
  email: string | null;
  telefono: string | null;
}

export interface CrearDocumentoPersonalInput extends PropietarioInput {
  empresaId: number;
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
