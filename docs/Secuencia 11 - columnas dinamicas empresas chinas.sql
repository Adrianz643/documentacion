-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


ALTER TABLE etapa_requisitos
    MODIFY COLUMN tipo_campo ENUM('archivo','texto','numero','boolean','fecha') NOT NULL DEFAULT 'archivo',
    ADD COLUMN personalizado TINYINT(1) NOT NULL DEFAULT 0 AFTER tipo_campo,
    ADD COLUMN deleted_at DATETIME NULL AFTER updated_at,
    ADD INDEX idx_er_deleted (deleted_at);
