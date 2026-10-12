/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema Notificaciones
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA NOTIFICACIONES
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: alertas personales por usuario generadas por el sistema (ej. FIEL
--          próxima a vencer). Tabla genérica y reutilizable: cualquier módulo
--          futuro que necesite avisar algo (declaraciones, facturas, Empresas
--          Chinas) solo inserta filas nuevas, sin requerir cambios de esquema.
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;


CREATE TABLE IF NOT EXISTS notificaciones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT UNSIGNED NOT NULL,
    tipo            VARCHAR(60)  NOT NULL,
    origen_tabla    VARCHAR(60)  NOT NULL,
    origen_id       INT UNSIGNED NOT NULL,
    dias_restantes  TINYINT      NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    cuerpo          VARCHAR(500) NOT NULL,
    ruta            VARCHAR(300) NOT NULL,
    leida           TINYINT(1)   NOT NULL DEFAULT 0,
    leida_en        DATETIME     NULL,
    creado_por      INT UNSIGNED NULL,
    modificado_por  INT UNSIGNED NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME     NULL,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_notif_usuario (usuario_id, deleted_at, leida),
    INDEX idx_notif_origen  (origen_tabla, origen_id, usuario_id, dias_restantes, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

