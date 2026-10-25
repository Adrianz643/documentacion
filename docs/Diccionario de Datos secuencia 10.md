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
- **Notificaciones de vencimiento (`server/src/jobs/facturasVencimiento.job.ts`):** cada 60 s el job busca facturas y facturas HL con `fecha_vencimiento` entre hoy y `dias_anticipacion` días (el umbral global de la Secuencia 8) y crea una notificación en `notificaciones` por usuario activo, con los mismos criterios de no repetición que FIEL. El vencimiento es siempre la fecha capturada manualmente; no se aplica ninguna regla de 4 años.
