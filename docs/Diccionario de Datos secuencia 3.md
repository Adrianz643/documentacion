# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Notificaciones (alertas del sistema por usuario)
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 3** | `notificaciones` | Transaccional | Alertas personales por usuario, generadas por el sistema (ej. FIEL próxima a vencer). |

**Diseño genérico:** la tabla no depende de un módulo específico — `origen_tabla` + `origen_id` apuntan al registro que originó la alerta (hoy `fiel_registros`, a futuro podría ser `declaraciones`, `empresas_chinas`, etc.) sin requerir cambios de esquema.

---

## `notificaciones`
Una fila = una alerta dirigida a un usuario. El mismo evento (ej. la FIEL de un propietario por vencer) genera una fila por cada usuario activo del sistema.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la notificación. |
| `usuario_id` | `INT UNSIGNED` | NO | — | **FK** / `idx_notif_usuario` | Destinatario; referencia a `usuarios(id)` (`ON DELETE CASCADE`). |
| `tipo` | `VARCHAR(60)` | NO | — | — | Código del tipo de alerta (ej. `FIEL_VENCIMIENTO`). |
| `origen_tabla` | `VARCHAR(60)` | NO | — | `idx_notif_origen` | Tabla que originó la alerta (ej. `fiel_registros`). |
| `origen_id` | `INT UNSIGNED` | NO | — | `idx_notif_origen` | Id del registro en `origen_tabla` que originó la alerta. |
| `dias_restantes` | `TINYINT` | NO | — | `idx_notif_origen` | Días restantes al momento de generarse (3, 2, 1 o 0). Evita duplicar la alerta del mismo día y controla el reintento cada 5 minutos en el día 0. |
| `titulo` | `VARCHAR(200)` | NO | — | — | Título corto mostrado en la campana de notificaciones. |
| `cuerpo` | `VARCHAR(500)` | NO | — | — | Texto descriptivo (ej. "La FIEL de Juan Pérez vence en 2 días"). |
| `ruta` | `VARCHAR(300)` | NO | — | — | Ruta interna del frontend a la que navega al hacer click (detalle del propietario/documento). |
| `leida` | `TINYINT(1)` | NO | `0` | `idx_notif_usuario` | Bandera de lectura; se marca en `1` al hacer click en la notificación. |
| `leida_en` | `DATETIME` | SÍ | `NULL` | — | Fecha y hora en que se marcó como leída. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario autor del alta; `NULL` cuando la genera el job automático del sistema. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario autor de la última modificación (marcar leída/eliminar). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de generación de la alerta. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_notif_usuario` | Marca de borrado lógico: se establece cuando el usuario da clic en "eliminar" junto a la notificación, dando por entendido que fue atendida. |

### Regla de negocio (job del backend)

Un proceso programado revisa periódicamente `fiel_registros` (no eliminados) cuya `fecha_vencimiento` esté entre hoy y los próximos 3 días, y genera una notificación por cada usuario activo:

- **3, 2 o 1 días restantes:** una sola notificación por día (se verifica que no exista ya una fila con el mismo `origen_id` + `usuario_id` + `dias_restantes` antes de insertar).
- **0 días restantes (día del vencimiento):** una notificación nueva cada 5 minutos mientras el usuario no la haya atendido.

Marcar como leída o eliminar una notificación **no** detiene las siguientes: cada ocurrencia (cada día, o cada ciclo de 5 minutos en el día 0) es independiente y genera su propia fila.
