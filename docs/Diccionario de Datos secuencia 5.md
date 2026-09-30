# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Actividad — bitácora legible de acciones de usuarios
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 3** | `actividad_log` | Transaccional | Feed de actividad (crear/editar/eliminar/restaurar/login/logout) de todos los módulos del aplicativo. |

**No se modificó ninguna tabla existente.** Este subsistema reutiliza `usuarios` (vía `usuario_id`) para resolver nombre y rol del actor al momento de consultar la bitácora (`JOIN` con `personas` y `roles`, mismo patrón que `papelera.repository`).

**Diferencia con `auditoria_cambios` (Secuencia 1):** `auditoria_cambios` guarda diffs JSON técnicos (`datos_anteriores`/`datos_nuevos`) por tabla y registro, pensada como bitácora forense; no la puebla la aplicación. `actividad_log` es un feed legible con una `descripcion` en español pensado para alimentar directamente el módulo "Actividad" del frontend.

**Convención de auditoría:** igual que las Secuencias 2 y 4 — la tabla lleva `creado_por`, `modificado_por`, `created_at`, `updated_at` sin excepción, aunque sea una tabla de solo-inserción (`creado_por` coincide siempre con `usuario_id`: el actor registra su propia fila).

**Regla de visibilidad (aplicada en el backend, no en la tabla):** los roles `admin` y `superadmin` consultan toda la bitácora; los roles `editor` y `viewer` solo ven las filas donde `usuario_id` es el suyo propio. Mismo criterio aplicado también en el módulo Papelera sobre la columna `modificado_por` de cada tabla con borrado lógico.

---

## Capa 3 — Bitácora (Transaccional)

### 1. `actividad_log`
Registra cada acción relevante del usuario a través de todos los módulos (Auth, Documentos Personales, Declaraciones, Facturas, FIEL, Empresas Chinas, Usuarios, Papelera).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la fila de actividad. |
| `usuario_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** / `idx_actividad_usuario_fecha` | Referencia a `usuarios(id)`, actor de la acción (`ON DELETE SET NULL`). |
| `modulo` | `VARCHAR(50)` | NO | — | `idx_actividad_modulo` | Módulo de origen del evento (`AUTH`, `DOCUMENTOS_PERSONALES`, `DECLARACIONES`, `FACTURAS`, `FIEL`, `EMPRESAS_CHINAS`, `USUARIOS`, `PAPELERA`). |
| `accion` | `VARCHAR(30)` | NO | — | — | Tipo de acción (`crear`, `editar`, `eliminar`, `subir`, `restaurar`, `login`, `logout`). |
| `descripcion` | `VARCHAR(255)` | NO | — | — | Texto legible de la acción, mostrado directamente en el feed del frontend. |
| `referencia_tabla` | `VARCHAR(64)` | SÍ | `NULL` | — | Nombre de la tabla afectada, cuando aplica. |
| `referencia_id` | `INT UNSIGNED` | SÍ | `NULL` | — | Id del registro afectado en `referencia_tabla`, cuando aplica. |
| `ip_address` | `VARCHAR(45)` | SÍ | `NULL` | — | IP de origen (capturada en `login`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta (igual a `usuario_id`). |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación (la bitácora es de solo-inserción; queda `NULL` en la práctica). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | `idx_actividad_fecha` | Fecha y hora del evento. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`); no se usa en la práctica. |

---

## Semilla de Datos

- `permisos`: se agrega `actividad.leer` (`modulo = 'ACTIVIDAD'`, `accion = 'LEER'`).
- `permisos_rol`: se asigna `actividad.leer` a los roles `admin`, `editor`, `viewer`/`Visor` y `superadmin` (el wildcard de superadmin de la Secuencia 1 solo cubrió los permisos que existían en el momento en que se ejecutó, así que un permiso nuevo se asigna explícitamente).

**Nota de discrepancia detectada al aplicar esta secuencia (2026-09-12):** el seed de la Secuencia 1 nombra al 4º rol `viewer`, pero en la base de datos real (`gdprod`) ese rol está sembrado como `Visor` (español, con mayúscula) — son cadenas distintas, no una variación de mayúsculas. El script de esta secuencia contempla ambas grafías para no depender de cuál exista.
