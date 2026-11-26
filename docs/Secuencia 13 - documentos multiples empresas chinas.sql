-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


CREATE TABLE IF NOT EXISTS empresa_china_requisito_documentos (
    id                          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_china_requisito_id  INT UNSIGNED NOT NULL,
    documento_id                INT UNSIGNED NOT NULL,
    creado_por                  INT UNSIGNED NULL,
    modificado_por              INT UNSIGNED NULL,
    created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_ecrd_documento (documento_id),
    KEY idx_ecrd_requisito (empresa_china_requisito_id),
    CONSTRAINT fk_ecrd_requisito FOREIGN KEY (empresa_china_requisito_id) REFERENCES empresa_china_requisitos(id) ON DELETE CASCADE,
    CONSTRAINT fk_ecrd_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO empresa_china_requisito_documentos (empresa_china_requisito_id, documento_id, creado_por, modificado_por)
SELECT id, documento_id, creado_por, modificado_por
FROM empresa_china_requisitos
WHERE documento_id IS NOT NULL;
