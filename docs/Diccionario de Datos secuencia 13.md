# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Varios documentos por requisito en Empresas Chinas
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 4** | `empresa_china_requisito_documentos` | Transaccional | Documentos que una empresa china tiene cargados en un requisito de una etapa. |

**Motivación:** hasta la Secuencia 12, `empresa_china_requisitos` solo podía apuntar a un documento (`documento_id`), por lo que subir un segundo archivo en el mismo requisito reemplazaba al primero. Hay requisitos que piden dos, tres o más documentos, así que cada requisito ahora puede tener varios.

---

## Capa 4 — Transaccional

### 1. `empresa_china_requisito_documentos`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | — | **PK** | Identificador autoincremental. |
| `empresa_china_requisito_id` | `INT UNSIGNED` | NO | — | **FK** → `empresa_china_requisitos(id)` ON DELETE CASCADE, **IDX** `idx_ecrd_requisito` | Requisito de la empresa al que pertenece el documento. |
| `documento_id` | `INT UNSIGNED` | NO | — | **FK** → `documentos(id)` ON DELETE CASCADE, **UQ** `uq_ecrd_documento` | Documento cargado. Un documento pertenece a un solo requisito. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario que creó el registro. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Último usuario que lo modificó. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha de creación. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` (ON UPDATE) | — | Fecha de última modificación. |

---

## Reglas de negocio (aplicadas en la aplicación, no en la BD)

- **Migración de datos:** la Secuencia 13 copia a esta tabla cada `empresa_china_requisitos.documento_id` existente, de modo que ningún documento ya cargado se pierde.
- **`empresa_china_requisitos.documento_id`** se conserva como documento principal del requisito (el primero que sigue vigente), para los módulos que ya lo consultan.
- **Subir un archivo** agrega un documento al requisito; ya no reemplaza al anterior.
- **Quitar un documento** lo marca con borrado lógico (`documentos.deleted_at`); el archivo físico se conserva hasta que se purgue desde la Papelera. Si era el último documento y el requisito no tiene valor de texto, el requisito vuelve a estado pendiente.
- **API:** `POST /api/empresas-chinas/:id/requisitos/:codigo` agrega un documento y `DELETE /api/empresas-chinas/:id/requisitos/:codigo/documentos/:documentoId` quita uno solo. `DELETE /api/empresas-chinas/:id/requisitos/:codigo` sigue quitando todo el requisito.
