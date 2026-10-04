/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Recuperación de contraseña y
          alertas de FIEL por correo electrónico
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD)
-- Secuencia 9: recuperación de contraseña ("¿Olvidaste tu contraseña?") y
-- aviso por correo electrónico del vencimiento de la FIEL (ademas de la
-- campanita de notificaciones in-app que ya existia desde la Secuencia 3).
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;

-- ---------------------------------------------------------------------
-- 1. RECUPERACIÓN DE CONTRASEÑA
-- Se agregan dos columnas a usuarios (igual que intentos_fallidos /
-- bloqueado_hasta: estado de autenticacion embebido en la propia fila).
-- Se guarda el HASH SHA-256 del token (no el token en claro), igual que
-- sesiones.token, para que una fuga de la BD no permita restablecer
-- contraseñas de terceros.
-- ---------------------------------------------------------------------

ALTER TABLE usuarios
    ADD COLUMN reset_token_hash       VARCHAR(128) NULL AFTER bloqueado_hasta,
    ADD COLUMN reset_token_expires_at DATETIME     NULL AFTER reset_token_hash;

-- ---------------------------------------------------------------------
-- 2. BITÁCORA DE AVISOS DE FIEL POR CORREO (anti-spam)
-- El job server/src/jobs/fielVencimiento.job.ts ya revisaba cada 60s las
-- FIEL por vencer para la campanita in-app, con su propia deduplicacion
-- por (origen, usuario, dias_restantes) en la tabla notificaciones. Esa
-- tabla no aplica aqui porque el destinatario del correo es el titular
-- (propietarios.email), no un usuario interno del sistema (usuarios.id).
-- Esta tabla evita reenviar el mismo aviso de email para el mismo
-- fiel_registro en el mismo umbral de dias_restantes.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fiel_avisos_email_log (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fiel_id         INT UNSIGNED NOT NULL,
    dias_restantes  SMALLINT     NOT NULL,
    email_destino   VARCHAR(255) NOT NULL,
    enviado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_fiel_avisos_fiel_dias (fiel_id, dias_restantes),
    CONSTRAINT fk_fiel_avisos_fiel FOREIGN KEY (fiel_id) REFERENCES fiel_registros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
