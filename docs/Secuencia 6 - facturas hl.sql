/*
═══════════════════════════════════════════════════════════════════════════════
                      AVISO DE DERECHOS DE AUTOR Y RESERVA LEGAL
═══════════════════════════════════════════════════════════════════════════════
Autor: Adrian Alejandro Vazquez Zambrano
Proyecto: Sistema de Gestión Documental (gdprod) - Subsistema Facturas HL
Año: 2026. Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, modificación, adaptación,
distribución o explotación total o parcial sin el consentimiento previo, expreso
y por escrito del titular de los derechos de autor. Cualquier uso o alteración
no autorizada será perseguida conforme a las disposiciones legales civiles,
penales y administrativas en materia de propiedad intelectual.
═══════════════════════════════════════════════════════════════════════════════
*/
-- ═════════════════════════════════════════════════════════════════════
-- APLICATIVO GESTIÓN DOCUMENTAL (GDPROD) - SUBSISTEMA FACTURAS HL
-- Autor: Adrian Alejandro Vazquez Zambrano
-- Base de Datos: gdprod
-- Motor: MySQL 8.0 (InnoDB, utf8mb4)
-- Alcance: facturas de Hegewisch López (la consultora que opera este
--          aplicativo), espejo funcional de "Facturas" de ARDUM (Secuencia 2)
--          pero con almacenamiento propio y separado, ya que es otro módulo:
--          Hegewisch López no maneja propietarios de condominio/lote, así
--          que en vez de un propietario_id (FK a propietarios) cada factura
--          guarda un campo de texto libre `cliente`.
-- ═════════════════════════════════════════════════════════════════════

USE gdprod;

-- ---------------------------------------------------------------------
-- 1. CAPA 3: FACTURAS HL (Transaccional)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS facturas_hl (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente        VARCHAR(180) NOT NULL,
    fecha          DATE NOT NULL,
    comprobante_id INT UNSIGNED NULL,
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at     DATETIME NULL,

    FOREIGN KEY (comprobante_id) REFERENCES documentos(id) ON DELETE SET NULL,
    INDEX idx_facturas_hl_fecha    (fecha),
    INDEX idx_facturas_hl_deleted  (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- NOTA — Bucket de empresas para los comprobantes:
-- `documentos.empresa_id` es NOT NULL, así que al subir un comprobante de
-- Factura HL se necesita una fila en `empresas` para referenciar. Se usa
-- la fila id=3 ('Hegewisch Lopez', tipo 'nacional', slug 'hl'), agregada
-- directamente en la base (igual que el resto de `empresas`, que tampoco
-- se siembra por INSERT en este snapshot — ver Secuencia 2). Esa fila es
-- solo un bucket técnico: el frontend no la expone como "empresa"
-- navegable, no tiene propietarios propios y no aparece en el listado de
-- Empresas.
--
-- El comprobante reutiliza el tipo de documento 'COMPROBANTE' del catálogo
-- `tipos_documento` (mismo que usan `declaraciones` y `facturas` de ARDUM),
-- sin requerir una clave nueva.
-- ---------------------------------------------------------------------
