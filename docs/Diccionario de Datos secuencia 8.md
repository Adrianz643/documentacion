# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Configuración de Alertas de Vencimiento de FIEL
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 1** | `configuracion_alertas_fiel` | Singleton (1 fila) | Días de anticipación con los que el job de vencimientos avisa antes de que una FIEL expire. |

**Motivación:** hasta la Secuencia 7, el número de días de anticipación con el que `server/src/jobs/fielVencimiento.job.ts` generaba notificaciones de vencimiento de FIEL estaba fijo en código (`DATEDIFF(...) BETWEEN 0 AND 3`). Esta secuencia agrega una tabla de una sola fila para que un admin/superadmin lo configure desde el módulo de Configuración del aplicativo, sin tocar código ni redesplegar.

---

## Capa 1 — Configuración

### 1. `configuracion_alertas_fiel`
Tabla singleton: siempre tiene exactamente una fila (`id = 1`).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `TINYINT UNSIGNED` | NO | — | **PK** | Fijo en `1`; la tabla nunca tiene más de una fila. |
| `dias_anticipacion` | `TINYINT UNSIGNED` | NO | `3` | — | Número de días antes del vencimiento de una FIEL en los que empieza a generarse la notificación (rango válido aplicado en el servicio: 1–90). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario (admin/superadmin) que sembró la fila inicial. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del último usuario que cambió el valor. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Semilla de Datos

- `configuracion_alertas_fiel`: 1 fila (`id = 1`, `dias_anticipacion = 3`) para preservar el comportamiento previo a esta secuencia hasta que un admin lo cambie.

## Reglas de negocio (aplicadas en aplicación, no en la BD)

- **Lectura/edición** (`server/src/modules/configuracion/*`): expone `GET /api/configuracion/alertas-fiel` y `PUT /api/configuracion/alertas-fiel`, ambos protegidos con el permiso `usuarios.editar` (solo `admin`/`superadmin`, mismo criterio que `/api/backups`). El servicio valida que el valor enviado sea un entero entre 1 y 90; fuera de ese rango responde `400`.
- **Job de vencimientos** (`server/src/jobs/fielVencimiento.job.ts`): en cada corrida (cada 60s) consulta `configuracion_alertas_fiel.dias_anticipacion` y lo usa como límite superior del rango `DATEDIFF(fecha_vencimiento, CURDATE()) BETWEEN 0 AND ?` (antes fijo en `3`). Si la fila no existe todavía en un entorno sin esta migración aplicada, el repositorio cae a un valor por defecto de `3` en memoria sin romper el job.
- **Frontend** (`configuracion.component.ts`/`.html`): el campo "Días de anticipación" solo se muestra y es editable para usuarios con el permiso `usuarios.editar` (misma sección que hoy muestra el estado de Respaldos); se guarda al instante al cambiar el valor, igual que la preferencia de modo oscuro.
