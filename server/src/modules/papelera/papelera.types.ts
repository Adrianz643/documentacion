export type ModuloPapelera =
  | 'documentos-personales'
  | 'fiel'
  | 'declaraciones'
  | 'facturas'
  | 'facturas-hl'
  | 'empresas-chinas'
  | 'usuarios'
  | 'documentos';

export interface PapeleraItemDTO {
  id: number;
  modulo: ModuloPapelera;
  moduloLabel: string;
  tipo: string;
  nombre: string;
  eliminadoPor: string;
  fechaEliminacion: string;
  diasRestantes: number;
}
