# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Columnas dinámicas en las etapas de Empresas Chinas
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas/Columnas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 4 (modificada)** | `etapa_requisitos` | Catálogo | Se agregan `personalizado` y `deleted_at`, y el valor `fecha` en `tipo_campo`, para que los usuarios puedan crear y eliminar columnas desde cada etapa. |

**Motivación:** cada columna de las Etapas 1 a 5 es un registro de `etapa_requisitos`, y los valores por empresa ya se guardan en `empresa_china_requisitos`. Para poder agregar columnas desde la pantalla, como en Facturas, basta con permitir que los usuarios inserten (y den de baja) registros en ese catálogo, distinguiéndolos de los requisitos originales.

---

## Modificación de `etapa_requisitos`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `tipo_campo` | `ENUM('archivo','texto','numero','boolean','fecha')` | NO | `'archivo'` | — | Se agrega el valor `fecha` a los existentes. |
| `personalizado` | `TINYINT(1)` | NO | `0` | — | `1` si la columna fue creada por un usuario desde la pantalla; `0` para los requisitos originales de la Secuencia 4. |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | **IDX** `idx_er_deleted` | Borrado lógico de la columna. Los valores ya capturados en `empresa_china_requisitos` se conservan pero dejan de mostrarse. |

---

## Reglas de negocio (aplicadas en la aplicación, no en la BD)

- **Alta de columna:** `POST /api/empresas-chinas/etapa/:etapaNum/requisitos` con `descripcion` (máx. 200 caracteres) y `tipoCampo`. El `codigo` se genera como `<etapa>.<n>`, donde `n` es el mayor consecutivo usado en esa etapa (incluidos los dados de baja) más 1.
- **Baja de columna:** `DELETE /api/empresas-chinas/requisitos/:id`. Solo se permite sobre columnas con `personalizado = 1`; los requisitos originales no se pueden eliminar.
- **Check List y progreso:** las columnas personalizadas no cuentan para el cálculo de `progreso_pct` ni para `empresa_china_etapa_checklist`; solo cuentan los requisitos originales.
- **Valores:** se guardan en `empresa_china_requisitos`. Para `archivo` se usa `documento_id`; para el resto `valor_texto`. Los valores `numero` deben ser numéricos, `fecha` en formato `AAAA-MM-DD` y `boolean` solo `Sí` o `No`.
