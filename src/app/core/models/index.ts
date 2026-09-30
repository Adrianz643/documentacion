export type TipoEmpresa        = 'nacional' | 'china';
export type TipoDeclaracion    = 'mensual' | 'mensual_cero';
export type FrecuenciaPago     = 'mensual' | 'bimestral' | 'anual';
export type EstadoEmpresaChina = 'en_proceso' | 'pendiente' | 'finalizada' | 'archivada';
export type TipoCampo          = 'archivo' | 'texto' | 'numero' | 'fecha' | 'boolean';
export type MimeType           = string;

export interface Rol { id: number; nombre: string; descripcion?: string | null; }
export interface Subrol { id: number; clave: string; nombre: string; }
export interface LoginRequest { username: string; password: string; }
export interface PersonaResumen { id: number; nombre: string; apellidoPaterno: string; apellidoMaterno: string; email: string; }
export interface RolResumen { id: number; nombre: string; }
export interface EstadoUsuarioResumen { id: number; clave: string; nombre: string; }
export interface UsuarioAutenticado { id: number; username: string; persona: PersonaResumen; rol: RolResumen; permisos: string[]; subroles: string[]; ultimoLogin?: string | null; modoOscuro: boolean; }
export interface Apariencia { modoOscuro: boolean; }
export interface AuthResponse { token: string; usuario: UsuarioAutenticado; }

export interface UsuarioListItem { id: number; username: string; persona: PersonaResumen; rol: RolResumen; estado: EstadoUsuarioResumen; ultimoLogin: string | null; subroles: string[]; }

export interface PersonaDetalle {
  id: number; tipoDocumentoId: number; paisId: number; nombre: string; apellidoPaterno: string; apellidoMaterno: string;
  fechaNacimiento: string; curp: string; rfc: string | null; email: string; telefono: string | null;
}
export interface UsuarioDetalle { id: number; username: string; rol: RolResumen; estado: EstadoUsuarioResumen; persona: PersonaDetalle; ultimoLogin: string | null; subroles: string[]; }

export interface PersonaInput {
  tipoDocumentoId: number; paisId: number; nombre: string; apellidoPaterno: string; apellidoMaterno: string;
  fechaNacimiento: string; curp: string; rfc: string | null; email: string; telefono: string | null;
}
export interface CrearUsuarioRequest { username: string; password: string; rolId: number; estadoId: number; persona: PersonaInput; subroles: string[]; }
export interface ActualizarUsuarioRequest { username: string; password?: string | null; rolId: number; estadoId: number; persona: PersonaInput; subroles: string[]; }
export interface ActualizarPerfilPropioRequest { username: string; password?: string | null; persona: PersonaInput; }

export interface Pais { id: number; codigoIso: string; nombre: string; }
export interface CatalogosUsuarios { paises: Pais[]; tiposDocumento: TipoDocumento[]; roles: Rol[]; estadosUsuario: EstadoUsuarioResumen[]; subroles: Subrol[]; }
export interface Empresa { id: number; nombre: string; tipo: TipoEmpresa; activa: boolean; slug: string; createdAt: string; updatedAt: string; }
export interface Propietario { id: number; empresaId: number; nombre: string; numeroLote?: string; curp?: string; email?: string; telefono?: string; activo: boolean; createdAt: string; updatedAt: string; }
export interface TipoDocumento { id: number; clave: string; nombre: string; }
export interface Documento { id: number; empresaId: number; propietarioId?: number; tipoDocumentoId: number; tipoDocumento?: TipoDocumento; nombreArchivo: string; rutaStorage: string; mimeType: MimeType; tamanoByes: number; subidoPor: number; createdAt: string; }
export interface DocumentoPersonal { id: number; propietario: Propietario; contratoArdumId?: number; contratoArdumDoc?: Documento; contratoHegewischId?: number; contratoHegewischDoc?: Documento; csfId?: number; csfDoc?: Documento; acuseCitaId?: number; acuseCitaDoc?: Documento; }
export interface ColumnaPersonalizada { id: number; empresaId: number; seccion: string; nombre: string; tipo: TipoCampo; orden: number; }
export interface ValorColumnaPersonalizada { id: number; columnaId: number; propietarioId?: number; empresaChinaId?: number; valorTexto?: string; valorDocumentoId?: number; valorDocumento?: Documento; }
export interface FielRegistro { id: number; propietarioId: number; propietario?: Propietario; clavePrivadaId?: number; clavePrivadaDoc?: Documento; certificadoId?: number; certificadoDoc?: Documento; contrasena?: string | null; fechaCreacion?: string; fechaVencimiento?: string; }
export interface Declaracion { id: number; propietarioId: number; propietario?: Propietario; tipo: TipoDeclaracion; siguientePagoFrecuencia: FrecuenciaPago; fechaUltimoPago?: string; fechaDeclaracion?: string; comprobanteId?: number; comprobanteDoc?: Documento; periodoMes: number; periodoAnio: number; }
export interface Factura { id: number; propietarioId: number; propietario?: Propietario; fecha: string; comprobanteId?: number; comprobanteDoc?: Documento; }
export interface FacturaHl { id: number; cliente: string; fecha: string; comprobanteId?: number; comprobanteDoc?: Documento; }
export interface EmpresaChina { id: number; codigo: string; nombre: string; representanteLegal?: string; correoElectronico?: string; telefono?: string; fechaRegistro?: string; etapaActual: number; estado: EstadoEmpresaChina; progresoPct: number; createdAt: string; updatedAt: string; }
export interface EtapaRequisito { id: number; etapaNum: number; codigo: string; descripcion: string; tipoCampo: TipoCampo; }
export interface EmpresaChinaRequisito { id: number; empresaChinaId: number; requisitoId: number; requisito?: EtapaRequisito; documentoId?: number; documento?: Documento; valorTexto?: string; completado: boolean; }
export interface EmpresaChinaEtapaChecklist { id: number; empresaChinaId: number; etapaNum: number; completada: boolean; completadaEn?: string; }
export interface KpiEmpresasChinas { total: number; enProceso: number; pendientes: number; finalizadas: number; progresoPorEtapa: { etapa: number; nombre: string; empresas: number; completadas: number; enProceso: number; pendientes: number; }[]; }
export interface ConfiguracionNotificacion { id: number; empresaId: number; tipo: string; delMes: number; activa: boolean; }
export interface NotificacionLog { id: number; tipo: string; titulo: string; cuerpo: string; ruta: string; leida: boolean; diasRestantes: number; createdAt: string; }
export interface NotificacionesListado { data: NotificacionLog[]; noLeidas: number; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; perPage: number; }
export interface ApiError { message: string; code?: string; field?: string; }
export interface TableColumn { key: string; label: string; visible: boolean; sortable?: boolean; type?: 'text' | 'date' | 'currency' | 'file' | 'badge'; }
