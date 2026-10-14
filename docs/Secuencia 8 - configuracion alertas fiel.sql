-- Autor: Adrian Alejandro Vazquez Zambrano

USE gdprod;


CREATE TABLE IF NOT EXISTS configuracion_alertas_fiel (
    id                 TINYINT UNSIGNED NOT NULL,
    dias_anticipacion  TINYINT UNSIGNED NOT NULL DEFAULT 3,
    creado_por         INT UNSIGNED NULL,
    modificado_por     INT UNSIGNED NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO configuracion_alertas_fiel (id, dias_anticipacion) VALUES (1, 3);

