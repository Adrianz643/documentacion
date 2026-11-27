// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

export interface NotificacionDTO {
  id: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  ruta: string;
  leida: boolean;
  diasRestantes: number;
  createdAt: string;
}

export interface NotificacionesListadoDTO {
  data: NotificacionDTO[];
  noLeidas: number;
}

export interface CrearNotificacionInput {
  usuarioId: number;
  tipo: string;
  origenTabla: string;
  origenId: number;
  diasRestantes: number;
  titulo: string;
  cuerpo: string;
  ruta: string;
}
