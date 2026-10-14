-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

CREATE DATABASE IF NOT EXISTS gdprod
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gdprod;

CREATE TABLE IF NOT EXISTS cat_paises (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_iso  CHAR(2)      NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cat_tipos_documento (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave       VARCHAR(20)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cat_estados_usuario (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave       VARCHAR(30)  NOT NULL UNIQUE,
    nombre      VARCHAR(60)  NOT NULL,
    descripcion VARCHAR(255) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS personas (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo_documento_id  INT UNSIGNED NOT NULL,
    pais_id            INT UNSIGNED NOT NULL,
    nombre             VARCHAR(100) NOT NULL,
    apellido_paterno   VARCHAR(100) NOT NULL,
    apellido_materno   VARCHAR(100) NOT NULL,
    fecha_nacimiento   DATE         NOT NULL,
    curp               CHAR(18)     NOT NULL UNIQUE,
    rfc                VARCHAR(13)  NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    telefono           VARCHAR(20)  NULL,
    creado_por         INT UNSIGNED NULL,
    modificado_por     INT UNSIGNED NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         DATETIME     NULL,

    FOREIGN KEY (tipo_documento_id) REFERENCES cat_tipos_documento(id),
    FOREIGN KEY (pais_id)           REFERENCES cat_paises(id),
    INDEX idx_nombre   (apellido_paterno, apellido_materno, nombre),
    INDEX idx_email    (email),
    INDEX idx_deleted  (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(50)  NOT NULL UNIQUE,
    descripcion    VARCHAR(255) NULL,
    activo         TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permisos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    modulo      VARCHAR(50)  NOT NULL,
    accion      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(255) NULL,
    creado_por  INT UNSIGNED NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_modulo_accion (modulo, accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permisos_rol (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rol_id     INT UNSIGNED NOT NULL,
    permiso_id INT UNSIGNED NOT NULL,
    creado_por INT UNSIGNED NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_rol_permiso (rol_id, permiso_id),
    FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    persona_id        INT UNSIGNED NOT NULL UNIQUE,
    rol_id            INT UNSIGNED NOT NULL,
    estado_id         INT UNSIGNED NOT NULL,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    salt              VARCHAR(64)  NULL,
    intentos_fallidos TINYINT      NOT NULL DEFAULT 0,
    bloqueado_hasta   DATETIME     NULL,
    ultimo_login      DATETIME     NULL,
    creado_por        INT UNSIGNED NULL,
    modificado_por    INT UNSIGNED NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME     NULL,

    FOREIGN KEY (persona_id) REFERENCES personas(id)           ON DELETE RESTRICT,
    FOREIGN KEY (rol_id)     REFERENCES roles(id)              ON DELETE RESTRICT,
    FOREIGN KEY (estado_id)  REFERENCES cat_estados_usuario(id) ON DELETE RESTRICT,
    INDEX idx_username (username),
    INDEX idx_deleted  (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios_hist (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id        INT UNSIGNED NOT NULL,
    rol_id            INT UNSIGNED NOT NULL,
    estado_id         INT UNSIGNED NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    salt              VARCHAR(64)  NULL,
    intentos_fallidos TINYINT      NOT NULL,
    bloqueado_hasta   DATETIME     NULL,
    operacion         ENUM('UPDATE','DELETE') NOT NULL,
    modificado_por    INT UNSIGNED NULL,
    fecha_operacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS sesiones (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT UNSIGNED NOT NULL,
    token         VARCHAR(255) NOT NULL UNIQUE,
    ip_address    VARCHAR(45)  NULL,
    user_agent    VARCHAR(512) NULL,
    expira_en     DATETIME     NOT NULL,
    cerrada_en    DATETIME     NULL,
    motivo_cierre ENUM('LOGOUT','EXPIRACION','ADMIN','OTRO') NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token     (token),
    INDEX idx_expira_en (expira_en),
    INDEX idx_usuario   (usuario_id, cerrada_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intentos_login (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NULL,
    exitoso     TINYINT(1)   NOT NULL DEFAULT 0,
    ip_address  VARCHAR(45)  NULL,
    user_agent  VARCHAR(512) NULL,
    descripcion VARCHAR(255) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_fecha (usuario_id, created_at),
    INDEX idx_ip_fecha      (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria_cambios (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tabla_nombre     VARCHAR(64)  NOT NULL,
    registro_id      INT UNSIGNED NOT NULL,
    operacion        ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    datos_anteriores JSON         NULL,
    datos_nuevos     JSON         NULL,
    usuario_id       INT UNSIGNED NULL,
    ip_address       VARCHAR(45)  NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tabla_registro (tabla_nombre, registro_id),
    INDEX idx_usuario        (usuario_id),
    INDEX idx_fecha          (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TRIGGER IF EXISTS trg_usuarios_before_update;
CREATE TRIGGER trg_usuarios_before_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
INSERT INTO usuarios_hist (
    usuario_id, rol_id, estado_id, password_hash, salt,
    intentos_fallidos, bloqueado_hasta, operacion, modificado_por
) VALUES (
    OLD.id, OLD.rol_id, OLD.estado_id, OLD.password_hash, OLD.salt,
    OLD.intentos_fallidos, OLD.bloqueado_hasta, 'UPDATE', NEW.modificado_por
);

DROP TRIGGER IF EXISTS trg_usuarios_before_delete;
CREATE TRIGGER trg_usuarios_before_delete
BEFORE DELETE ON usuarios
FOR EACH ROW
INSERT INTO usuarios_hist (
    usuario_id, rol_id, estado_id, password_hash, salt,
    intentos_fallidos, bloqueado_hasta, operacion, modificado_por
) VALUES (
    OLD.id, OLD.rol_id, OLD.estado_id, OLD.password_hash, OLD.salt,
    OLD.intentos_fallidos, OLD.bloqueado_hasta, 'DELETE', OLD.modificado_por
);


INSERT IGNORE INTO cat_paises (codigo_iso, nombre) VALUES
    ('MX', 'México'),
    ('US', 'Estados Unidos'),
    ('ES', 'España');

INSERT IGNORE INTO cat_tipos_documento (clave, nombre) VALUES
    ('CURP', 'CURP'),
    ('INE', 'Credencial INE'),
    ('PASAPORTE', 'Pasaporte');

INSERT IGNORE INTO cat_estados_usuario (clave, nombre) VALUES
    ('ACTIVO', 'Activo'),
    ('BLOQUEADO', 'Bloqueado temporalmente'),
    ('INACTIVO', 'Inactivo'),
    ('ELIMINADO', 'Eliminado lógicamente');

INSERT IGNORE INTO roles (nombre, descripcion) VALUES
    ('superadmin', 'Acceso total al sistema y configuraciones'),
    ('admin', 'Administración de usuarios y expedientes generales'),
    ('editor', 'Captura, foliado y modificación de documentos'),
    ('Visor', 'Consulta y visualización de expedientes sin permisos de edición');

INSERT IGNORE INTO permisos (nombre, modulo, accion, descripcion) VALUES
    ('auth.login', 'AUTH', 'LOGIN', 'Iniciar sesión en el aplicativo'),
    ('usuarios.crear', 'USUARIOS', 'CREAR', 'Dar de alta nuevos usuarios y colaboradores'),
    ('usuarios.leer', 'USUARIOS', 'LEER', 'Consultar padrón de usuarios'),
    ('usuarios.editar', 'USUARIOS', 'EDITAR', 'Actualizar datos de usuarios y asignar roles'),
    ('documentos.crear', 'DOCUMENTOS', 'CREAR', 'Cargar y radicar nuevos documentos'),
    ('documentos.leer', 'DOCUMENTOS', 'LEER', 'Visualizar y descargar expedientes'),
    ('documentos.editar', 'DOCUMENTOS', 'EDITAR', 'Modificar metadatos o versionar documentos');

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT 1, id FROM permisos;

INSERT IGNORE INTO personas (
    id, tipo_documento_id, pais_id, nombre, apellido_paterno, apellido_materno,
    fecha_nacimiento, curp, rfc, email, telefono
) VALUES (
    1, 1, 1, 'Administrador', 'Sistema', 'General',
    '1990-01-01', 'ASG900101HDFRXX01', 'ASG900101000', 'admin@gdprod.local', '5555555555'
);

INSERT IGNORE INTO usuarios (
    id, persona_id, rol_id, estado_id, username, password_hash, salt
) VALUES (
    1, 1, 1, 1, 'admin',
    '$2a$10$wT0XkR8x1m9v6dYpY.o7beL0mQ/K2dF6VqHjH0FmGk1fJ5aE6c5Zq',
    NULL
);


INSERT IGNORE INTO permisos (nombre, modulo, accion, descripcion) VALUES
    ('documentos.crear', 'DOCUMENTOS', 'CREAR', 'Cargar y radicar nuevos documentos'),
    ('documentos.leer', 'DOCUMENTOS', 'LEER', 'Visualizar y descargar expedientes'),
    ('documentos.editar', 'DOCUMENTOS', 'EDITAR', 'Modificar metadatos o versionar documentos');

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1 WHERE r.nombre = 'superadmin';

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre = 'admin'
  AND p.nombre IN ('auth.login','usuarios.crear','usuarios.leer','usuarios.editar',
                    'documentos.crear','documentos.leer','documentos.editar');

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre = 'editor'
  AND p.nombre IN ('auth.login','usuarios.leer','documentos.crear','documentos.leer','documentos.editar');

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre = 'Visor'
  AND p.nombre IN ('auth.login','documentos.leer');


CREATE TABLE IF NOT EXISTS apariencia (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id     INT UNSIGNED NOT NULL UNIQUE,
    modo_oscuro    TINYINT(1)   NOT NULL DEFAULT 0,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;