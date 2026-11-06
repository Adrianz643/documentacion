# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Valores de las columnas personalizadas en Facturas, Facturas HL y Declaraciones
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 4** | `valores_columnas_registro` | Transaccional | Valor (texto o documento) que cada registro de Facturas, Facturas HL o Declaraciones tiene en una columna personalizada. |

**Motivación:** hasta la Secuencia 11, las columnas creadas con "Agregar columna" en Facturas, Facturas HL y Declaraciones solo existían como encabezado (`columnas_personalizadas`): no había dónde guardar el valor de cada fila, por lo que no se podían capturar datos ni subir documentos en ellas. La tabla `valores_columnas_personalizadas` (Secuencia 2) no sirve para esto porque su llave es `propietario_id` y las facturas HL no tienen propietario.

---

## Capa 4 — Transaccional

### 1. `valores_columnas_registro`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | — | **PK** | Identificador autoincremental. |
| `columna_id` | `INT UNSIGNED` | NO | — | **FK** → `columnas_personalizadas(id)` ON DELETE CASCADE, **UQ** (con `registro_id`) | Columna personalizada a la que pertenece el valor. |
| `registro_id` | `INT UNSIGNED` | NO | — | **IDX** `idx_vcr_registro`, **UQ** (con `columna_id`) | Id de la fila: `facturas.id`, `facturas_hl.id` o `declaraciones.id`, según la `seccion` de la columna. No es llave foránea porque apunta a tablas distintas. |
| `valor_texto` | `TEXT` | SÍ | `NULL` | — | Valor capturado para columnas de tipo texto, número, fecha y sí/no (`Sí` / `No`). |
| `valor_documento_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** → `documentos(id)` ON DELETE SET NULL | Documento subido para columnas de tipo archivo. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario que creó el registro. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Último usuario que lo modificó. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha de creación. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` (ON UPDATE) | — | Fecha de última modificación. |

---

## Reglas de negocio (aplicadas en la aplicación, no en la BD)

- **Secciones soportadas:** `facturas`, `facturas_hl`, `declaraciones` y `declaraciones_cero`. El `registro_id` debe existir y no estar eliminado en la tabla correspondiente.
- **Validación por tipo de columna:** `numero` debe ser numérico, `fecha` en formato `AAAA-MM-DD`, `boolean` solo `Sí` o `No`, `texto` hasta 2000 caracteres.
- **Archivos:** al reemplazar o quitar un documento, el anterior se marca con borrado lógico (`documentos.deleted_at`) y el archivo físico se conserva hasta que se purgue desde la Papelera, igual que en el resto de los módulos.
- **Quitar un valor** elimina la fila de `valores_columnas_registro`. Eliminar una columna (borrado lógico en `columnas_personalizadas`) oculta sus valores sin borrarlos.
- **API:** `GET /api/valores-columnas?empresaId=&seccion=`, `PUT /api/valores-columnas/:columnaId/:registroId`, `POST /api/valores-columnas/:columnaId/:registroId/archivo` y `DELETE /api/valores-columnas/:columnaId/:registroId`.
