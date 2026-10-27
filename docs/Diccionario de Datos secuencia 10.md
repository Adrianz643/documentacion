# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Vigencia de Facturas (ARDUM) y Facturas HL
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas/Columnas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 3 (modificada)** | `facturas` | Transaccional | Se agrega `fecha_vencimiento` para calcular la vigencia de la factura. |
| **Capa 3 (modificada)** | `facturas_hl` | Transaccional | Se agrega `fecha_vencimiento` para calcular la vigencia de la factura HL. |

**Motivación:** las Facturas y las Facturas HL manejan el mismo esquema de fechas y vigencia que la FIEL: Fecha de Creación (columna `fecha` existente), Fecha de Vencimiento y Vigencia. La Vigencia no se almacena; se calcula en la aplicación a partir de `fecha_vencimiento`.

---

## Modificación de `facturas` y `facturas_hl`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `fecha_vencimiento` | `DATE` | SÍ | `NULL` | — | Fecha en que vence la factura. Es opcional; cuando es `NULL` la Vigencia se muestra como "Sin fecha". Debe ser igual o posterior a `fecha` (Fecha de Creación). |

---

## Reglas de negocio (aplicadas en la aplicación, no en la BD)

- **Fecha de Creación:** corresponde a la columna `fecha` ya existente; solo cambia su etiqueta en pantalla.
- **Vigencia (misma regla que FIEL):** `Vigente` si faltan más de 90 días, `Por vencer (N días)` si faltan 90 días o menos, `Vencida` si la fecha ya pasó y `Sin fecha` si `fecha_vencimiento` es `NULL`.
- **Validación:** el backend rechaza con `400` una `fecha_vencimiento` anterior a `fecha`.
- **Aviso en pantalla:** si hay facturas vencidas o por vencer, ambas pantallas muestran un aviso con el conteo, igual que el módulo FIEL.
- **Notificaciones mensuales (`server/src/jobs/facturasMensuales.job.ts`):** del día 10 al 17 de cada mes el job crea, una sola vez por mes y por usuario activo, una notificación en `notificaciones` para Facturas ARDUM y otra para Facturas HL, indicando que las facturas deben registrarse a más tardar el día 17. `origen_id` es el periodo (`año*100+mes`) y `dias_restantes` es `0`, lo que evita duplicados. No depende de `fecha_vencimiento` ni aplica regla de 4 años.
