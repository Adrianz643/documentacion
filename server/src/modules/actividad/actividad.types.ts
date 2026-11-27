// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

export interface ActividadDTO {
  id: number;
  usuario: string;
  rol: string;
  modulo: string;
  accion: string;
  descripcion: string;
  fecha: string;
}

export interface RegistrarActividadInput {
  usuarioId: number | null;
  modulo: string;
  accion: string;
  descripcion: string;
  referenciaTabla?: string;
  referenciaId?: number;
  ip?: string;
}
