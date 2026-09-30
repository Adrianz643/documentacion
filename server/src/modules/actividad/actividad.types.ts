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
