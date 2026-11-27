// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
