/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema Actividad
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA ACTIVIDAD
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: bitácora legible de actividad de usuarios (crear/editar/eliminar/
--          restaurar/login/logout) a través de todos los módulos del
--          aplicativo (ARDUM, Empresas Chinas, Usuarios, Papelera, Auth).
--          Es distinta de `auditoria_cambios` (Secuencia 1), que guarda
--          diffs JSON técnicos por tabla/registro; `actividad_log` guarda
--          un feed legible pensado para el módulo "Actividad" del frontend.
-- Convención: mismas reglas que las Secuencias 2 y 4 — todas las tablas
--          llevan columnas de auditoría (creado_por, modificado_por,
--          created_at, updated_at), incluidos los catálogos.
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;

-- ---------------------------------------------------------------------
-- 1. CAPA 3: BITÁCORA (Transaccional)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS actividad_log (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT UNSIGNED NULL,
    modulo           VARCHAR(50)  NOT NULL,
    accion           VARCHAR(30)  NOT NULL,
    descripcion      VARCHAR(255) NOT NULL,
    referencia_tabla VARCHAR(64)  NULL,
    referencia_id    INT UNSIGNED NULL,
    ip_address       VARCHAR(45)  NULL,
    creado_por       INT UNSIGNED NULL,
    modificado_por   INT UNSIGNED NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_actividad_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_actividad_usuario_fecha (usuario_id, created_at),
    INDEX idx_actividad_modulo (modulo),
    INDEX idx_actividad_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. PERMISO DE CONSULTA Y ASIGNACIÓN POR ROL
-- Regla de negocio: admin y superadmin ven TODA la actividad; editor y
-- viewer solo ven la suya propia (filtro aplicado en el backend según
-- usuarios.rol_id, no en esta tabla).
-- ---------------------------------------------------------------------

INSERT IGNORE INTO permisos (nombre, modulo, accion, descripcion) VALUES
    ('actividad.leer', 'ACTIVIDAD', 'LEER', 'Consultar la bitacora de actividad del sistema');

-- superadmin ya cubierto por su wildcard de la Secuencia 1 (sección 6)
-- NOTA: el 4o rol (consulta/solo-lectura) esta sembrado en la BD real como
-- 'Visor' (no 'viewer' como dice el seed original de la Secuencia 1) --
-- se incluyen ambas grafias para que este script sea idempotente sin
-- importar cual de las dos exista.
INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre IN ('admin','editor','viewer','Visor') AND p.nombre = 'actividad.leer';

-- El wildcard de superadmin de la Secuencia 1 se ejecuto una sola vez contra
-- los permisos que existian en ese momento; un permiso creado despues (como
-- este) no queda cubierto automaticamente, por eso se asigna explicitamente.
INSERT IGNORE INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON 1=1
WHERE r.nombre = 'superadmin' AND p.nombre = 'actividad.leer';
