-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

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

