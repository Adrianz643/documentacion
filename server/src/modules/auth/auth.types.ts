export interface LoginInput {
  username: string;
  password: string;
  ip: string;
  userAgent: string;
}

export interface PersonaResumenDTO {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
}

export interface RolResumenDTO {
  id: number;
  nombre: string;
}

export interface UsuarioAutenticadoDTO {
  id: number;
  username: string;
  persona: PersonaResumenDTO;
  rol: RolResumenDTO;
  permisos: string[];
  subroles: string[];
  modoOscuro: boolean;
}

export interface LoginResult {
  token: string;
  usuario: UsuarioAutenticadoDTO;
}

export interface ForgotPasswordInput {
  usuario: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}
