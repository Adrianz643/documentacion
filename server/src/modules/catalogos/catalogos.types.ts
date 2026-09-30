export interface PaisDTO {
  id: number;
  codigoIso: string;
  nombre: string;
}

export interface TipoDocumentoDTO {
  id: number;
  clave: string;
  nombre: string;
}

export interface RolDTO {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface EstadoUsuarioDTO {
  id: number;
  clave: string;
  nombre: string;
}

export interface SubrolDTO {
  id: number;
  clave: string;
  nombre: string;
}

export interface CatalogosUsuariosDTO {
  paises: PaisDTO[];
  tiposDocumento: TipoDocumentoDTO[];
  roles: RolDTO[];
  estadosUsuario: EstadoUsuarioDTO[];
  subroles: SubrolDTO[];
}
