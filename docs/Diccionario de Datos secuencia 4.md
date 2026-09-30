# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Empresas Chinas — expediente de constitución por etapas
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 1** | `etapa_requisitos` | Catálogo | Requisitos fijos de las 5 etapas de constitución (17+5+7+4+3 = 36 filas). |
| **Capa 2** | `empresas_chinas` | Maestra | Empresa china en proceso de constitución (equivalente a `propietarios` en ARDUM). |
| **Capa 3** | `empresa_china_requisitos` | Transaccional | Valor/documento capturado por una empresa china para un requisito de una etapa. |
| **Capa 3** | `empresa_china_etapa_checklist` | Transaccional | Marca de "Check List completo" por empresa china y etapa. |

**No se modificó ninguna tabla existente.** Este subsistema reutiliza:
- `empresas` — se sembró la fila `id = 2` ("Empresas Chinas", `tipo = 'china'`) como contraparte de ARDUM (`id = 1`).
- `documentos` — los archivos de este módulo se insertan con `empresa_id = 2` y `propietario_id = NULL` (no aplica el concepto de propietario); la relación con la empresa china específica se resuelve vía `empresa_china_requisitos.documento_id` + `empresa_china_requisitos.empresa_china_id`.
- `usuarios` — para `creado_por`/`modificado_por`.

**Convención de auditoría:** igual que la Secuencia 2 (ARDUM) — todas las tablas llevan `creado_por`, `modificado_por`, `created_at`, `updated_at`, incluido el catálogo `etapa_requisitos`.

---

## Capa 1 — Catálogos

### 1. `etapa_requisitos`
Catálogo fijo de los requisitos documentales de cada una de las 5 etapas (Aprobación de nombre, RFC, Firma Electrónica, Cuenta bancaria, Otros trámites).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `SMALLINT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del requisito. |
| `etapa_num` | `TINYINT UNSIGNED` | NO | — | `uq_etapa_req_codigo` / `idx_er_etapa` | Número de etapa (1 a 5). |
| `codigo` | `VARCHAR(10)` | NO | — | `uq_etapa_req_codigo` | Clave visible del requisito dentro de la etapa (ej. `1.1`, `3.4`). |
| `descripcion` | `VARCHAR(500)` | NO | — | — | Texto descriptivo del requisito. |
| `tipo_campo` | `ENUM('archivo','texto','numero','boolean')` | NO | `'archivo'` | — | Tipo de valor que se captura para este requisito. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Capa 2 — Tabla Maestra

### 2. `empresas_chinas`
Empresa china que está siendo constituida; equivalente a `propietarios` en el subsistema ARDUM.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la empresa china. |
| `codigo` | `VARCHAR(20)` | NO | — | **UQ** | Folio visible (ej. `CH-0001`). |
| `nombre` | `VARCHAR(180)` | NO | — | — | Nombre o razón social de la empresa. |
| `representante_legal` | `VARCHAR(180)` | SÍ | `NULL` | — | Nombre del representante legal. |
| `correo_electronico` | `VARCHAR(180)` | SÍ | `NULL` | — | Correo de contacto. |
| `telefono` | `VARCHAR(30)` | SÍ | `NULL` | — | Teléfono de contacto. |
| `fecha_registro` | `DATE` | SÍ | `NULL` | — | Fecha en que se dio de alta el expediente. |
| `etapa_actual` | `TINYINT UNSIGNED` | NO | `1` | — | Etapa (1–5) en la que se encuentra actualmente. |
| `estado` | `ENUM('en_proceso','pendiente','finalizada','archivada')` | NO | `'en_proceso'` | `idx_ec_estado` | Estado global del expediente. |
| `progreso_pct` | `TINYINT UNSIGNED` | NO | `0` | — | Porcentaje de avance mostrado en el dashboard de KPIs. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_ec_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

## Capa 3 — Expediente por Etapa (Transaccional)

### 3. `empresa_china_requisitos`
Resuelve la relación N:M entre empresas chinas y requisitos: por cada requisito que una empresa completa, se guarda su documento y/o valor de texto.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del registro. |
| `empresa_china_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_ecr` | Referencia a `empresas_chinas(id)` (`ON DELETE CASCADE`). |
| `requisito_id` | `SMALLINT UNSIGNED` | NO | — | **FK** / `uq_ecr` | Referencia a `etapa_requisitos(id)`. |
| `documento_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` cuando el requisito es de tipo `archivo` (`ON DELETE SET NULL`). |
| `valor_texto` | `TEXT` | SÍ | `NULL` | — | Valor capturado cuando el requisito es de tipo `texto`, `numero` o `boolean`. |
| `completado` | `TINYINT(1)` | NO | `0` | — | Indica si el requisito quedó satisfecho. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_ecr_deleted` | Marca de borrado lógico. |

### 4. `empresa_china_etapa_checklist`
Marca si el "Check List" de una etapa quedó completo para una empresa china (checkbox visible en cada pantalla de etapa).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del registro. |
| `empresa_china_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_ecec` | Referencia a `empresas_chinas(id)` (`ON DELETE CASCADE`). |
| `etapa_num` | `TINYINT UNSIGNED` | NO | — | `uq_ecec` | Etapa a la que corresponde el checklist (1–5). |
| `completada` | `TINYINT(1)` | NO | `0` | — | Estado del checklist de esa etapa. |
| `completada_en` | `DATETIME` | SÍ | `NULL` | — | Fecha y hora en que se marcó como completa. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación (quien marcó/desmarcó el check). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Semilla de Datos

- `empresas`: se agrega la fila `id = 2` (`Empresas Chinas`, tipo `china`, slug `empresas-chinas`), como contraparte de ARDUM (`id = 1`) ya sembrada en la Secuencia 2.
- `etapa_requisitos`: 36 filas — 17 de la Etapa 1, 5 de la Etapa 2, 7 de la Etapa 3, 4 de la Etapa 4 y 3 de la Etapa 5 — tomadas de los catálogos que ya operaba el frontend (`etapaN-data.service.ts`), más el ajuste posterior (2026-09-18) que agregó `2.5 Acta Constitutiva`, `3.5 Certificado (.cer)`, `3.6 Llave privada (.key)` y `3.7 Contraseña capturable` (ver AJUSTE POSTERIOR en `Secuencia 4 - empresas chinas.sql`). Ninguna de estas altas modificó la estructura de la tabla: `etapa_requisitos` ya es genérica (etapa_num + codigo + descripcion + tipo_campo), así que el frontend y el backend soportan cualquier requisito nuevo — incluyendo subir archivo — sin cambios de código.
