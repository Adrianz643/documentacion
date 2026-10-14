-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


CREATE TABLE IF NOT EXISTS facturas_hl (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente        VARCHAR(180) NOT NULL,
    fecha          DATE NOT NULL,
    comprobante_id INT UNSIGNED NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at     DATETIME NULL,

    FOREIGN KEY (comprobante_id) REFERENCES documentos(id) ON DELETE SET NULL,
    INDEX idx_facturas_hl_fecha    (fecha),
    INDEX idx_facturas_hl_deleted  (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

