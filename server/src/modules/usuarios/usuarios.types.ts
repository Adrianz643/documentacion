import type { PersonaResumenDTO, RolResumenDTO } from '../auth/auth.types';

export interface EstadoUsuarioResumenDTO {
  id: number;
  clave: string;
  nombre: string;
}

export interface UsuarioPerfilDTO {
  id: number;
  username: string;
  persona: PersonaResumenDTO;
  rol: RolResumenDTO;
  ultimoLogin: Date | null;
  permisos: string[];
  subroles: string[];
  modoOscuro: boolean;
}

export interface UsuarioListItemDTO {
  id: number;
  username: string;
  persona: PersonaResumenDTO;
  rol: RolResumenDTO;
  estado: EstadoUsuarioResumenDTO;
  ultimoLogin: Date | null;
  subroles: string[];
}

export interface PersonaDetalleDTO {
  id: number;
  tipoDocumentoId: number;
  paisId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  curp: string;
  rfc: string | null;
  email: string;
  telefono: string | null;
}

export interface UsuarioDetalleDTO {
  id: number;
  username: string;
  rol: RolResumenDTO;
  estado: EstadoUsuarioResumenDTO;
  persona: PersonaDetalleDTO;
  ultimoLogin: Date | null;
  subroles: string[];
}

export interface ListarUsuariosQuery {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface PersonaInput {
  tipoDocumentoId: number;
  paisId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  curp: string;
  rfc: string | null;
  email: string;
  telefono: string | null;
}

export interface CrearUsuarioInput {
  username: string;
  password: string;
  rolId: number;
  estadoId: number;
  persona: PersonaInput;
  subroles: string[];
}

export interface ActualizarUsuarioInput {
  username: string;
  password: string | null;
  rolId: number;
  estadoId: number;
  persona: PersonaInput;
  subroles: string[];
}

export interface ActualizarPerfilPropioInput {
  username: string;
  password: string | null;
  persona: PersonaInput;
}
