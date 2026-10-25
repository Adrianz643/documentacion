-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


ALTER TABLE facturas
    ADD COLUMN fecha_vencimiento DATE NULL AFTER fecha;

ALTER TABLE facturas_hl
    ADD COLUMN fecha_vencimiento DATE NULL AFTER fecha;
