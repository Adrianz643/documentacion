-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


CREATE TABLE IF NOT EXISTS valores_columnas_registro (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    columna_id          INT UNSIGNED NOT NULL,
    registro_id         INT UNSIGNED NOT NULL,
    valor_texto         TEXT NULL,
    valor_documento_id  INT UNSIGNED NULL,
    creado_por          INT UNSIGNED NULL,
    modificado_por      INT UNSIGNED NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_vcr_columna_registro (columna_id, registro_id),
    KEY idx_vcr_registro (registro_id),
    CONSTRAINT fk_vcr_columna FOREIGN KEY (columna_id) REFERENCES columnas_personalizadas(id) ON DELETE CASCADE,
    CONSTRAINT fk_vcr_documento FOREIGN KEY (valor_documento_id) REFERENCES documentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
