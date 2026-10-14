-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


CREATE TABLE IF NOT EXISTS subroles (
    id             SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave          VARCHAR(30)  NOT NULL,
    nombre         VARCHAR(60)  NOT NULL,
    activo         TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_subrol_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS usuario_subroles (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id     INT UNSIGNED NOT NULL,
    subrol_id      SMALLINT UNSIGNED NOT NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_usuario_subrol (usuario_id, subrol_id),
    INDEX idx_us_subrol (subrol_id),
    CONSTRAINT fk_us_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_us_subrol  FOREIGN KEY (subrol_id)  REFERENCES subroles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO subroles (clave, nombre) VALUES
    ('ARDUM',           'ARDUM'),
    ('ARDUM_HL',        'ARDUM HL'),
    ('EMPRESAS_CHINAS', 'Empresas Chinas');

INSERT IGNORE INTO usuario_subroles (usuario_id, subrol_id)
SELECT u.id, s.id
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
CROSS JOIN subroles s
WHERE u.deleted_at IS NULL AND LOWER(r.nombre) IN ('editor', 'visor');

