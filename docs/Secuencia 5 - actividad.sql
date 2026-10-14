-- Autor: Adrian Alejandro Vazquez Zambrano

USE gdprod;


CREATE TABLE IF NOT EXISTS actividad_log (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT UNSIGNED NULL,
    modulo           VARCHAR(50)  NOT NULL,
    accion           VARCHAR(30)  NOT NULL,
    descripcion      VARCHAR(255) NOT NULL,
    referencia_tabla VARCHAR(64)  NULL,
    referencia_id    INT UNSIGNED NULL,
    ip_address       VARCHAR(45)  NULL,
    creado_por       INT UNSIGNED NULL,
    modificado_por   INT UNSIGNED NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_actividad_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_actividad_usuario_fecha (usuario_id, created_at),
    INDEX idx_actividad_modulo (modulo),
    INDEX idx_actividad_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO permisos (nombre, modulo, accion, descripcion) VALUES
    ('actividad.leer', 'ACTIVIDAD', 'LEER', 'Consultar la bitacora de actividad del sistema');

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre IN ('admin','editor','viewer','Visor') AND p.nombre = 'actividad.leer';

INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre = 'superadmin' AND p.nombre = 'actividad.leer';
