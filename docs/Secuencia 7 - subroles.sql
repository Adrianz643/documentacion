/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema Subroles
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA SUBROLES
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: control de acceso por modulo de negocio (ARDUM, ARDUM HL,
--          Empresas Chinas) para usuarios con rol editor o Visor. Los roles
--          admin/superadmin no usan subrol: siempre tienen acceso total.
--          Un usuario editor/Visor puede tener uno, dos o los tres subroles.
-- Convención: mismas reglas que la Secuencia 1 (IAM) — catalogo + tabla
--          relacional N:M, con columnas de auditoria (creado_por,
--          modificado_por, created_at, updated_at) incluido el catalogo.
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;


CREATE TABLE IF NOT EXISTS subroles (
    id             SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave          VARCHAR(30)  NOT NULL,
    nombre         VARCHAR(60)  NOT NULL,
    activo         TINYINT(1)   NOT NULL DEFAULT 1,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_subrol_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS usuario_subroles (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id     INT UNSIGNED NOT NULL,
    subrol_id      SMALLINT UNSIGNED NOT NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_usuario_subrol (usuario_id, subrol_id),
    INDEX idx_us_subrol (subrol_id),
    CONSTRAINT fk_us_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_us_subrol  FOREIGN KEY (subrol_id)  REFERENCES subroles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO subroles (clave, nombre) VALUES
    ('ARDUM',           'ARDUM'),
    ('ARDUM_HL',        'ARDUM HL'),
    ('EMPRESAS_CHINAS', 'Empresas Chinas');

INSERT IGNORE INTO usuario_subroles (usuario_id, subrol_id)
SELECT u.id, s.id
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
CROSS JOIN subroles s
WHERE u.deleted_at IS NULL AND LOWER(r.nombre) IN ('editor', 'visor');

