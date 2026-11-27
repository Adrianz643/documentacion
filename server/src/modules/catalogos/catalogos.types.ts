// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
