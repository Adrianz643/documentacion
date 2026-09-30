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
