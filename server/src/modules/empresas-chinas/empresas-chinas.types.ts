export type EstadoEmpresaChina = 'en_proceso' | 'pendiente' | 'finalizada' | 'archivada';
export type TipoCampoRequisito = 'archivo' | 'texto' | 'numero' | 'boolean';

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

export interface EtapaRequisitoDTO {
  id: number;
  etapaNum: number;
  codigo: string;
  descripcion: string;
  tipoCampo: TipoCampoRequisito;
}

export interface EmpresaChinaRequisitoDTO {
  id: number;
  empresaChinaId: number;
  requisitoId: number;
  documentoId: number | null;
  documento: DocumentoDTO | null;
  valorTexto: string | null;
  completado: boolean;
}

export interface EmpresaChinaDTO {
  id: number;
  codigo: string;
  nombre: string;
  representanteLegal: string | null;
  correoElectronico: string | null;
  telefono: string | null;
  fechaRegistro: string | null;
  etapaActual: number;
  estado: EstadoEmpresaChina;
  progresoPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilaEtapaDTO extends EmpresaChinaDTO {
  requisitos: Record<string, EmpresaChinaRequisitoDTO>;
  checkList: boolean;
}

export interface EtapaDetalleDTO {
  etapaNum: number;
  requisitosEstado: { req: EtapaRequisitoDTO; valor: EmpresaChinaRequisitoDTO | undefined }[];
  checkList: boolean;
}

export interface EmpresaChinaDetalleDTO extends EmpresaChinaDTO {
  etapas: EtapaDetalleDTO[];
}

export interface CrearEmpresaChinaInput {
  nombre: string;
  representanteLegal: string | null;
  correoElectronico: string | null;
  telefono: string | null;
  fechaRegistro: string | null;
}

export interface KpiProgresoEtapaDTO {
  etapa: number;
  nombre: string;
  empresas: number;
  completadas: number;
  enProceso: number;
  pendientes: number;
}

export interface KpiEmpresasChinasDTO {
  total: number;
  enProceso: number;
  pendientes: number;
  finalizadas: number;
  progresoPorEtapa: KpiProgresoEtapaDTO[];
}

export interface ArchivoSubidoInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
