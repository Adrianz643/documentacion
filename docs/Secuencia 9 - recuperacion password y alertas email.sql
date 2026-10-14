-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


ALTER TABLE usuarios
    ADD COLUMN reset_token_hash       VARCHAR(128) NULL AFTER bloqueado_hasta,
    ADD COLUMN reset_token_expires_at DATETIME     NULL AFTER reset_token_hash;


CREATE TABLE IF NOT EXISTS fiel_avisos_email_log (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fiel_id         INT UNSIGNED NOT NULL,
    dias_restantes  SMALLINT     NOT NULL,
    email_destino   VARCHAR(255) NOT NULL,
    enviado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_fiel_avisos_fiel_dias (fiel_id, dias_restantes),
    CONSTRAINT fk_fiel_avisos_fiel FOREIGN KEY (fiel_id) REFERENCES fiel_registros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
