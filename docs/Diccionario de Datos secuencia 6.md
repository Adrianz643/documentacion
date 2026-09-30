# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Facturas HL (facturas de Hegewisch López, la consultora)
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 3** | `facturas_hl` | Transaccional | Facturas de Hegewisch López, con su comprobante. |

**Relación con ARDUM (Secuencia 2):** `facturas_hl` es un espejo funcional de `facturas`, pero con **almacenamiento separado** por tratarse de otro módulo: Hegewisch López es la consultora que opera el aplicativo, no una empresa con propietarios de condominio/lote. Por eso `facturas_hl` no tiene `propietario_id` (FK a `propietarios`) — en su lugar guarda un campo de texto libre `cliente`.

---

## `facturas_hl`
Una fila = una factura de Hegewisch López, con su comprobante opcional.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la factura. |
| `cliente` | `VARCHAR(180)` | NO | — | — | Nombre del cliente/emisor, capturado como texto libre (sin relación a `propietarios`). |
| `fecha` | `DATE` | NO | — | `idx_facturas_hl_fecha` | Fecha de la factura. |
| `comprobante_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_facturas_hl_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera (módulo `facturas-hl`). |

### Comprobante (`documentos`)

El comprobante de cada factura HL se guarda como una fila más en la tabla compartida `documentos` (la misma que usan ARDUM y Empresas Chinas), con:

- `documentos.empresa_id` = **3** (`Hegewisch Lopez`, fila agregada directamente en `empresas` como bucket técnico; no se siembra por `INSERT` en `schema.sql`, igual que el resto de `empresas` — ver Secuencia 2). No se expone como "empresa" navegable en el frontend ni tiene propietarios propios.
- `documentos.propietario_id` = `NULL` siempre (Facturas HL no tiene propietarios).
- `documentos.tipo_documento_id` = el mismo catálogo `COMPROBANTE` de `tipos_documento` que usan `declaraciones` y `facturas` de ARDUM.

Como `documentos.propietario_id` es `NULL` para estos comprobantes, el reenlace automático de Papelera (best-effort, ver `papelera.repository.ts`) no aplica: si se elimina y luego se restaura un comprobante HL desde la papelera de "Archivos", el archivo se revive pero **no** se reconecta solo a su factura — hay que volver a subirlo o reconectarlo manualmente. Es la misma limitación documentada para cualquier documento sin propietario.

### Papelera

`facturas_hl` participa en el módulo de Papelera como el módulo `facturas-hl` (`moduloLabel`: "Facturas HL", `tipo`: "Factura HL"), con el mismo ciclo de retención de 30 días que el resto de los módulos.
