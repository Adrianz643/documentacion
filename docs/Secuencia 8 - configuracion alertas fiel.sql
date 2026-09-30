/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema Configuración de Alertas FIEL
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA CONFIGURACIÓN DE
-- ALERTAS DE VENCIMIENTO DE FIEL
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: hasta esta secuencia, el job server/src/jobs/fielVencimiento.job.ts
--          tenia fijo en codigo (BETWEEN 0 AND 3) el numero de dias de
--          anticipacion con el que se avisa del vencimiento de una FIEL.
--          Esta secuencia agrega una tabla singleton (una sola fila, id=1)
--          para que un admin/superadmin defina ese valor desde el modulo de
--          Configuracion, sin tocar codigo ni redesplegar.
-- Convención: misma regla de auditoria que el resto del esquema (creado_por,
--          modificado_por, created_at, updated_at).
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;

-- ---------------------------------------------------------------------
-- 1. TABLA SINGLETON DE CONFIGURACIÓN
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS configuracion_alertas_fiel (
    id                 TINYINT UNSIGNED NOT NULL,
    dias_anticipacion  TINYINT UNSIGNED NOT NULL DEFAULT 3,
    creado_por         INT UNSIGNED NULL,
    modificado_por     INT UNSIGNED NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. SEMILLA DE DATOS
-- Fila unica (id = 1) con el valor 3 para preservar el comportamiento
-- actual (BETWEEN 0 AND 3) hasta que un admin lo cambie desde la UI.
-- ---------------------------------------------------------------------

INSERT IGNORE INTO configuracion_alertas_fiel (id, dias_anticipacion) VALUES (1, 3);

-- ---------------------------------------------------------------------
-- NOTA — Regla de negocio (aplicada en la aplicacion, no en la BD):
--   - server/src/modules/configuracion/*: expone GET/PUT
--     /api/configuracion/alertas-fiel, protegido con el permiso
--     'usuarios.editar' (solo admin/superadmin, igual que /api/backups).
--   - server/src/jobs/fielVencimiento.job.ts: en cada corrida (cada 60s)
--     lee configuracion_alertas_fiel.dias_anticipacion y lo usa como limite
--     superior del rango de dias restantes (antes fijo en 3).
--   - Rango valido validado en el servicio: entero entre 1 y 90 dias.
--   - Si la fila no existe (entorno nuevo sin esta migracion aplicada), el
--     repositorio cae a un valor por defecto de 3 en memoria, sin romper el
--     job.
-- ---------------------------------------------------------------------
