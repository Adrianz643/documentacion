export interface DocumentoRecienteDTO {
  id: number;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  rutaStorage: string;
  createdAt: string;
  subidoPorNombre: string;
  subidoPorRol: string;
  modulo: string;
  ruta: Array<string | number> | null;
}

export interface DashboardResumenDTO {
  documentosTotales: number;
  recientes: DocumentoRecienteDTO[];
}
