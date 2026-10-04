import type { RowDataPacket } from 'mysql2';

/**
 * Fila resultante de usuarios + personas + roles + cat_estados_usuario,
 * usada exclusivamente durante el flujo de autenticacion (incluye password_hash).
 */
export interface UsuarioAuthRow extends RowDataPacket {
  usuario_id: number;
  username: string;
  password_hash: string;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  rol_id: number;
  rol_nombre: string;
  estado_clave: string;
  persona_id: number;
  persona_nombre: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  persona_email: string;
}

/**
 * Fila de perfil de usuario para consumo general (sin password_hash).
 */
export interface UsuarioPerfilRow extends RowDataPacket {
  usuario_id: number;
  username: string;
  rol_id: number;
  rol_nombre: string;
  estado_clave: string;
  ultimo_login: Date | null;
  persona_id: number;
  persona_nombre: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  persona_email: string;
}

/**
 * Fila de una fila del listado paginado de usuarios (sin datos sensibles de identidad completos).
 */
export interface UsuarioListadoRow extends RowDataPacket {
  usuario_id: number;
  username: string;
  ultimo_login: Date | null;
  rol_id: number;
  rol_nombre: string;
  estado_id: number;
  estado_clave: string;
  estado_nombre: string;
  persona_id: number;
  persona_nombre: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  persona_email: string;
}

/**
 * Fila completa de un usuario para el formulario de edicion (incluye datos de persona editables).
 */
export interface UsuarioDetalleRow extends RowDataPacket {
  usuario_id: number;
  username: string;
  rol_id: number;
  rol_nombre: string;
  estado_id: number;
  estado_clave: string;
  estado_nombre: string;
  ultimo_login: Date | null;
  persona_id: number;
  tipo_documento_id: number;
  pais_id: number;
  persona_nombre: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  fecha_nacimiento: Date;
  curp: string;
  rfc: string | null;
  persona_email: string;
  telefono: string | null;
}

export interface PermisoRow extends RowDataPacket {
  nombre: string;
}

export interface SubrolRow extends RowDataPacket {
  id: number;
  clave: string;
  nombre: string;
}

export interface PaisRow extends RowDataPacket {
  id: number;
  codigo_iso: string;
  nombre: string;
}

export interface TipoDocumentoRow extends RowDataPacket {
  id: number;
  clave: string;
  nombre: string;
}

export interface RolRow extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface EstadoUsuarioRow extends RowDataPacket {
  id: number;
  clave: string;
  nombre: string;
}

export interface AparienciaRow extends RowDataPacket {
  usuario_id: number;
  modo_oscuro: number;
}

export interface ConfiguracionAlertaFielRow extends RowDataPacket {
  dias_anticipacion: number;
}

export interface NotificacionRow extends RowDataPacket {
  id: number;
  usuario_id: number;
  tipo: string;
  origen_tabla: string;
  origen_id: number;
  dias_restantes: number;
  titulo: string;
  cuerpo: string;
  ruta: string;
  leida: number;
  created_at: Date;
}

export interface FielPorVencerRow extends RowDataPacket {
  fiel_id: number;
  propietario_id: number;
  propietario_nombre: string;
  propietario_email: string | null;
  empresa_id: number;
  dias_restantes: number;
  fecha_vencimiento: Date;
}

export interface UsuarioActivoRow extends RowDataPacket {
  id: number;
}

/**
 * Fila usada por el flujo de recuperacion de contrasena: busca por username
 * o por el correo de la persona vinculada, solo entre usuarios activos.
 */
export interface UsuarioRecuperacionRow extends RowDataPacket {
  usuario_id: number;
  persona_nombre: string;
  persona_email: string;
}

export interface UsuarioPorResetTokenRow extends RowDataPacket {
  usuario_id: number;
}

export interface DeclaracionRow extends RowDataPacket {
  id: number;
  propietario_id: number;
  propietario_nombre: string;
  propietario_curp: string | null;
  propietario_email: string | null;
  propietario_telefono: string | null;
  propietario_activo: number;
  propietario_created_at: Date;
  propietario_updated_at: Date;
  tipo: 'mensual' | 'mensual_cero';
  siguiente_pago_frecuencia: 'mensual' | 'bimestral' | 'anual';
  fecha_ultimo_pago: Date | null;
  fecha_declaracion: Date | null;
  periodo_mes: number;
  periodo_anio: number;
  comprobante_id: number | null;
  comprobante_tipo_id: number | null;
  comprobante_nombre: string | null;
  comprobante_ruta: string | null;
  comprobante_mime: string | null;
  comprobante_tam: number | null;
  comprobante_subido_por: number | null;
  comprobante_creado: Date | null;
}

export interface FacturaRow extends RowDataPacket {
  id: number;
  propietario_id: number;
  propietario_nombre: string;
  propietario_curp: string | null;
  propietario_email: string | null;
  propietario_telefono: string | null;
  propietario_activo: number;
  propietario_created_at: Date;
  propietario_updated_at: Date;
  fecha: Date;
  comprobante_id: number | null;
  comprobante_tipo_id: number | null;
  comprobante_nombre: string | null;
  comprobante_ruta: string | null;
  comprobante_mime: string | null;
  comprobante_tam: number | null;
  comprobante_subido_por: number | null;
  comprobante_creado: Date | null;
}

export interface FacturaHlRow extends RowDataPacket {
  id: number;
  cliente: string;
  fecha: Date;
  comprobante_id: number | null;
  comprobante_tipo_id: number | null;
  comprobante_nombre: string | null;
  comprobante_ruta: string | null;
  comprobante_mime: string | null;
  comprobante_tam: number | null;
  comprobante_subido_por: number | null;
  comprobante_creado: Date | null;
}

export interface EmpresaChinaRow extends RowDataPacket {
  id: number;
  codigo: string;
  nombre: string;
  representante_legal: string | null;
  correo_electronico: string | null;
  telefono: string | null;
  fecha_registro: Date | null;
  etapa_actual: number;
  estado: 'en_proceso' | 'pendiente' | 'finalizada' | 'archivada';
  progreso_pct: number;
  created_at: Date;
  updated_at: Date;
}

export interface EtapaRequisitoRow extends RowDataPacket {
  id: number;
  etapa_num: number;
  codigo: string;
  descripcion: string;
  tipo_campo: 'archivo' | 'texto' | 'numero' | 'boolean';
}

export interface EmpresaChinaRequisitoValorRow extends RowDataPacket {
  id: number;
  empresa_china_id: number;
  requisito_id: number;
  requisito_codigo: string;
  etapa_num: number;
  documento_id: number | null;
  valor_texto: string | null;
  completado: number;
  doc_tipo_id: number | null;
  doc_nombre: string | null;
  doc_ruta: string | null;
  doc_mime: string | null;
  doc_tam: number | null;
  doc_subido_por: number | null;
  doc_creado: Date | null;
}

export interface EmpresaChinaChecklistRow extends RowDataPacket {
  empresa_china_id: number;
  etapa_num: number;
  completada: number;
  completada_en: Date | null;
}

export interface ColumnaPersonalizadaRow extends RowDataPacket {
  id: number;
  empresa_id: number;
  seccion: string;
  nombre: string;
  tipo: 'texto' | 'numero' | 'fecha' | 'archivo' | 'boolean';
  orden: number;
}

export interface DocumentoRow extends RowDataPacket {
  id: number;
  empresa_id: number;
  propietario_id: number | null;
  tipo_documento_id: number;
  nombre_archivo: string;
  ruta_storage: string;
  mime_type: string;
  tamano_bytes: number;
  subido_por: number;
  created_at: Date;
}

export interface PropietarioRow extends RowDataPacket {
  id: number;
  empresa_id: number;
  nombre: string;
  curp: string | null;
  email: string | null;
  telefono: string | null;
  activo: number;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentoPersonalRow extends RowDataPacket {
  id: number;
  propietario_id: number;
  propietario_nombre: string;
  propietario_numero_lote: string | null;
  propietario_curp: string | null;
  propietario_email: string | null;
  propietario_telefono: string | null;
  propietario_activo: number;
  propietario_created_at: Date;
  propietario_updated_at: Date;
  contrato_ardum_id: number | null;
  contrato_ardum_tipo_id: number | null;
  contrato_ardum_nombre: string | null;
  contrato_ardum_ruta: string | null;
  contrato_ardum_mime: string | null;
  contrato_ardum_tam: number | null;
  contrato_ardum_subido_por: number | null;
  contrato_ardum_creado: Date | null;
  contrato_hegewisch_id: number | null;
  contrato_hegewisch_tipo_id: number | null;
  contrato_hegewisch_nombre: string | null;
  contrato_hegewisch_ruta: string | null;
  contrato_hegewisch_mime: string | null;
  contrato_hegewisch_tam: number | null;
  contrato_hegewisch_subido_por: number | null;
  contrato_hegewisch_creado: Date | null;
  csf_id: number | null;
  csf_tipo_id: number | null;
  csf_nombre: string | null;
  csf_ruta: string | null;
  csf_mime: string | null;
  csf_tam: number | null;
  csf_subido_por: number | null;
  csf_creado: Date | null;
  acuse_cita_id: number | null;
  acuse_cita_tipo_id: number | null;
  acuse_cita_nombre: string | null;
  acuse_cita_ruta: string | null;
  acuse_cita_mime: string | null;
  acuse_cita_tam: number | null;
  acuse_cita_subido_por: number | null;
  acuse_cita_creado: Date | null;
}

export interface FielRegistroRow extends RowDataPacket {
  id: number;
  propietario_id: number;
  propietario_nombre: string;
  propietario_curp: string | null;
  propietario_email: string | null;
  propietario_telefono: string | null;
  propietario_activo: number;
  propietario_created_at: Date;
  propietario_updated_at: Date;
  fecha_creacion: Date | null;
  fecha_vencimiento: Date | null;
  clave_privada_id: number | null;
  clave_privada_tipo_id: number | null;
  clave_privada_nombre: string | null;
  clave_privada_ruta: string | null;
  clave_privada_mime: string | null;
  clave_privada_tam: number | null;
  clave_privada_subido_por: number | null;
  clave_privada_creado: Date | null;
  certificado_id: number | null;
  certificado_tipo_id: number | null;
  certificado_nombre: string | null;
  certificado_ruta: string | null;
  certificado_mime: string | null;
  certificado_tam: number | null;
  certificado_subido_por: number | null;
  certificado_creado: Date | null;
  contrasena: string | null;
}
