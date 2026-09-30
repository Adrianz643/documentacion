export interface PropietarioDTO {
  id: number;
  empresaId: number;
  nombre: string;
  curp: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
