// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

export type TipoColumnaPersonalizada = 'texto' | 'numero' | 'fecha' | 'archivo' | 'boolean';

export interface ColumnaPersonalizadaDTO {
  id: number;
  empresaId: number;
  seccion: string;
  nombre: string;
  tipo: TipoColumnaPersonalizada;
  orden: number;
}

export interface CrearColumnaPersonalizadaInput {
  empresaId: number;
  seccion: string;
  nombre: string;
  tipo: TipoColumnaPersonalizada;
}
