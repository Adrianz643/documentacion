-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026
-- Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

USE gdprod;


ALTER TABLE facturas
    ADD COLUMN fecha_vencimiento DATE NULL AFTER fecha;

ALTER TABLE facturas_hl
    ADD COLUMN fecha_vencimiento DATE NULL AFTER fecha;
