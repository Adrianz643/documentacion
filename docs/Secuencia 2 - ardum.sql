/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema ARDUM
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA ARDUM
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: expedientes de la empresa ARDUM (Documentos Personales, FIEL,
--          Declaraciones y Facturas). No incluye Empresas Chinas ni
--          notificaciones/configuración, que se documentarán en otra secuencia.
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;

-- ---------------------------------------------------------------------
-- 1. CAPA 1: CATÁLOGOS (Referenciales)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS empresas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    tipo        ENUM('nacional','china') NOT NULL DEFAULT 'nacional',
    slug        VARCHAR(160) NOT NULL UNIQUE,
    activa      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_empresas_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_documento (
    id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave       VARCHAR(60)  NOT NULL UNIQUE,
    nombre      VARCHAR(180) NOT NULL,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. CAPA 2: TABLAS MAESTRAS (Propietarios, Documentos y Columnas)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS propietarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    nombre      VARCHAR(180) NOT NULL,
    numero_lote VARCHAR(20)  NULL,
    curp        CHAR(18)     NULL,
    email       VARCHAR(180) NULL,
    telefono    VARCHAR(20)  NULL,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME     NULL,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT,
    INDEX idx_propietarios_empresa      (empresa_id),
    INDEX idx_propietarios_curp         (curp),
    INDEX idx_propietarios_numero_lote  (numero_lote),
    INDEX idx_propietarios_deleted      (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id         INT UNSIGNED NOT NULL,
    propietario_id     INT UNSIGNED NULL,
    tipo_documento_id  SMALLINT UNSIGNED NOT NULL,
    nombre_archivo     VARCHAR(300) NOT NULL,
    ruta_storage       VARCHAR(500) NOT NULL,
    mime_type          VARCHAR(100) NOT NULL,
    tamano_bytes       INT UNSIGNED NOT NULL,
    subido_por         INT UNSIGNED NOT NULL,
    creado_por         INT UNSIGNED NULL,
    modificado_por     INT UNSIGNED NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         DATETIME     NULL,

    FOREIGN KEY (empresa_id)        REFERENCES empresas(id)        ON DELETE RESTRICT,
    FOREIGN KEY (propietario_id)    REFERENCES propietarios(id)    ON DELETE SET NULL,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE RESTRICT,
    FOREIGN KEY (subido_por)        REFERENCES usuarios(id)        ON DELETE RESTRICT,
    INDEX idx_documentos_empresa     (empresa_id),
    INDEX idx_documentos_propietario (propietario_id),
    INDEX idx_documentos_tipo        (tipo_documento_id),
    INDEX idx_documentos_deleted     (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS columnas_personalizadas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED  NOT NULL,
    seccion     VARCHAR(80)   NOT NULL,
    nombre      VARCHAR(120)  NOT NULL,
    tipo        ENUM('texto','numero','fecha','archivo','boolean') NOT NULL DEFAULT 'texto',
    orden       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME      NULL,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_colpers_empresa_seccion (empresa_id, seccion),
    INDEX idx_colpers_deleted         (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. CAPA 3: EXPEDIENTES ARDUM (Documentos Personales, FIEL, Declaraciones,
--    Facturas) y valores de columnas personalizadas
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documentos_personales (
    id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    propietario_id        INT UNSIGNED NOT NULL UNIQUE,
    contrato_ardum_id     INT UNSIGNED NULL,
    contrato_hegewisch_id INT UNSIGNED NULL,
    csf_id                INT UNSIGNED NULL,
    acuse_cita_id         INT UNSIGNED NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (propietario_id)        REFERENCES propietarios(id) ON DELETE CASCADE,
    FOREIGN KEY (contrato_ardum_id)     REFERENCES documentos(id)   ON DELETE SET NULL,
    FOREIGN KEY (contrato_hegewisch_id) REFERENCES documentos(id)   ON DELETE SET NULL,
    FOREIGN KEY (csf_id)                REFERENCES documentos(id)   ON DELETE SET NULL,
    FOREIGN KEY (acuse_cita_id)         REFERENCES documentos(id)   ON DELETE SET NULL,
    INDEX idx_docpers_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fiel_registros (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    propietario_id    INT UNSIGNED NOT NULL UNIQUE,
    clave_privada_id  INT UNSIGNED NULL,
    certificado_id    INT UNSIGNED NULL,
    contrasena        VARCHAR(500) NULL,
    fecha_creacion    DATE NULL,
    fecha_vencimiento DATE NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (propietario_id)   REFERENCES propietarios(id) ON DELETE CASCADE,
    FOREIGN KEY (clave_privada_id) REFERENCES documentos(id)   ON DELETE SET NULL,
    FOREIGN KEY (certificado_id)   REFERENCES documentos(id)   ON DELETE SET NULL,
    INDEX idx_fiel_deleted     (deleted_at),
    INDEX idx_fiel_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS declaraciones (
    id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    propietario_id            INT UNSIGNED NOT NULL,
    tipo                      ENUM('mensual','mensual_cero') NOT NULL DEFAULT 'mensual',
    siguiente_pago_frecuencia ENUM('mensual','bimestral','anual') NOT NULL DEFAULT 'mensual',
    fecha_ultimo_pago         DATE NULL,
    fecha_declaracion         DATE NULL,
    comprobante_id            INT UNSIGNED NULL,
    periodo_mes               TINYINT UNSIGNED NOT NULL,
    periodo_anio              YEAR NOT NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comprobante_id) REFERENCES documentos(id)   ON DELETE SET NULL,
    INDEX idx_decl_propietario (propietario_id),
    INDEX idx_decl_periodo     (periodo_anio, periodo_mes),
    INDEX idx_decl_deleted     (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facturas (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    propietario_id INT UNSIGNED NOT NULL,
    fecha          DATE NOT NULL,
    comprobante_id INT UNSIGNED NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comprobante_id) REFERENCES documentos(id)   ON DELETE SET NULL,
    INDEX idx_fact_propietario (propietario_id),
    INDEX idx_fact_fecha       (fecha),
    INDEX idx_fact_deleted     (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS valores_columnas_personalizadas (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    columna_id         INT UNSIGNED NOT NULL,
    propietario_id     INT UNSIGNED NOT NULL,
    valor_texto        TEXT NULL,
    valor_documento_id INT UNSIGNED NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (columna_id)         REFERENCES columnas_personalizadas(id) ON DELETE CASCADE,
    FOREIGN KEY (propietario_id)     REFERENCES propietarios(id)            ON DELETE CASCADE,
    FOREIGN KEY (valor_documento_id) REFERENCES documentos(id)              ON DELETE SET NULL,
    UNIQUE KEY uq_vcp_columna_propietario (columna_id, propietario_id),
    INDEX idx_vcp_columna     (columna_id),
    INDEX idx_vcp_propietario (propietario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. SEMILLA DE DATOS (SEED INITIAL DATA)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO empresas (id, nombre, tipo, slug) VALUES
    (1, 'ARDUM', 'nacional', 'ardum');

INSERT IGNORE INTO tipos_documento (clave, nombre) VALUES
    ('CONTRATO_ARDUM',      'Contrato Ardum'),
    ('CONTRATO_HEGEWISCH',  'Contrato Hegewisch'),
    ('CSF',                 'Constancia de Situación Fiscal'),
    ('ACUSE_CITA',          'Acuse de cita'),
    ('FIEL_CLAVE',          'Clave privada (.key)'),
    ('FIEL_CERTIFICADO',    'Certificado (.cer)'),
    ('FIEL_CONTRASENA',     'Contraseña de la FIEL (.txt)'),
    ('COMPROBANTE',         'Comprobante de pago');

-- ---------------------------------------------------------------------
-- CAMBIO (2026-09-18): se agregó la columna numero_lote (VARCHAR(20) NULL)
-- a propietarios, con su índice idx_propietarios_numero_lote, para
-- identificar el lote del propietario en Documentos Personales.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- CAMBIO (2026-09-18): la contraseña de la FIEL dejó de capturarse como
-- archivo .txt. Se eliminó contrasena_id (y su FK a documentos) de
-- fiel_registros y se agregó la columna contrasena VARCHAR(500) NULL,
-- que guarda el valor cifrado (AES-256-GCM, clave FIEL_CONTRASENA_KEY en
-- el backend) capturado directamente en un input de texto en la UI.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- CAMBIO (2026-09-18): se eliminaron de declaraciones los campos
-- pago_inicial, siguiente_pago_monto y monto_ultimo_pago (ya no se
-- capturan en el formulario de "Nueva declaración" ni se muestran en
-- las tablas ni en el detalle).
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- NOTA: esta secuencia cubre únicamente los expedientes de ARDUM. Las
-- tablas de Empresas Chinas (empresas_chinas, etapa_requisitos,
-- empresa_china_requisitos, empresa_china_etapa_checklist) y las de
-- notificaciones/configuración se documentarán en una secuencia aparte.
-- Cuando esa secuencia exista, valores_columnas_personalizadas deberá
-- ampliarse con una columna empresa_china_id (NULL) para admitir
-- columnas personalizadas de ese módulo.
-- ---------------------------------------------------------------------
