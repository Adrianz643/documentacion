# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Recuperación de contraseña y alertas de FIEL por correo electrónico
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas/Columnas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 2 (modificada)** | `usuarios` | Maestra | Se agregan `reset_token_hash` y `reset_token_expires_at` para el flujo "¿Olvidaste tu contraseña?". |
| **Capa 3** | `fiel_avisos_email_log` | Bitácora | Evita reenviar el mismo correo de aviso de vencimiento de FIEL para el mismo registro y el mismo umbral de días restantes. |

**Motivación:** hasta la Secuencia 8, el vencimiento de una FIEL solo generaba una notificación en la campanita del frontend (tabla `notificaciones`, Secuencia 3). Esta secuencia agrega: (1) un flujo de recuperación de contraseña por correo para el login, y (2) el envío del mismo aviso de vencimiento de FIEL por correo electrónico al titular (`propietarios.email`), además de la campanita.

---

## Capa 2 — Modificación de `usuarios`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `reset_token_hash` | `VARCHAR(128)` | SÍ | `NULL` | — | Hash SHA-256 (hex, 64 caracteres) del token de recuperación enviado por correo. Se guarda el hash, no el token en claro, mismo criterio que `sesiones.token`. `NULL` cuando no hay una solicitud de recuperación vigente. |
| `reset_token_expires_at` | `DATETIME` | SÍ | `NULL` | — | Fecha/hora límite de validez del token (2 horas desde que se solicitó). Se limpia (`NULL`) al usarse o al solicitar un nuevo token. |

---

## Capa 3 — Bitácora

### 1. `fiel_avisos_email_log`

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | — | **PK** | Identificador autoincremental. |
| `fiel_id` | `INT UNSIGNED` | NO | — | **FK** → `fiel_registros(id)` ON DELETE CASCADE | Registro de FIEL al que corresponde el aviso enviado. |
| `dias_restantes` | `SMALLINT` | NO | — | **UQ** (junto con `fiel_id`) | Días restantes al vencimiento en el momento del envío (mismo criterio que `notificaciones.dias_restantes`). |
| `email_destino` | `VARCHAR(255)` | NO | — | — | Correo al que se envió el aviso (`propietarios.email` en el momento del envío). |
| `enviado_en` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha/hora de envío del correo. |

La llave única `(fiel_id, dias_restantes)` es la que evita el reenvío: el job de vencimientos solo envía el correo si no existe ya una fila para ese `fiel_id` con ese `dias_restantes` exacto.

---

## Reglas de negocio (aplicadas en la aplicación, no en la BD)

### Recuperación de contraseña (`server/src/modules/auth/*`)
- `POST /api/auth/forgot-password`: recibe `usuario` (username o correo de la persona). Busca el usuario activo correspondiente; si no existe, responde `200` genérico igual (para no permitir enumeración de usuarios). Si existe, genera un token aleatorio de 32 bytes (`crypto.randomBytes`), guarda su hash SHA-256 y `reset_token_expires_at = NOW() + 2 horas`, y envía un correo con el enlace `${APP_URL}/reset-password?token=<token-en-claro>`.
- `POST /api/auth/reset-password`: recibe `token` y `password`. Hashea el token recibido y busca un usuario con ese `reset_token_hash` y `reset_token_expires_at > NOW()`. Si no hay coincidencia o ya expiró, responde `400`. Si es válido, actualiza `password_hash` (bcrypt, 10 rondas), limpia `reset_token_hash`/`reset_token_expires_at`, reinicia `intentos_fallidos`/`bloqueado_hasta`, y cierra todas las sesiones activas del usuario (`sesiones.cerrada_en`) por seguridad.
- Ambos endpoints tienen un limitador de tasa (`express-rate-limit`) más estricto que el de login, ya que disparan envío de correo.

### Alertas de FIEL por correo (`server/src/jobs/fielVencimiento.job.ts`)
- En cada corrida (cada 60s), además de generar la notificación in-app ya existente, el job revisa si `propietarios.email` no es `NULL` y si ya existe una fila en `fiel_avisos_email_log` para `(fiel_id, dias_restantes)`. Si no existe, envía el correo de alerta (plantilla `plantillaAlertaFielVencimiento`) y registra la fila.
- El umbral de días (`dias_anticipacion`) es el mismo que ya configura el admin en el módulo de Configuración (Secuencia 8); no se agregó un segundo umbral independiente para el correo.
- Si el envío de correo falla (SMTP no configurado o caído), el error se captura y se registra en el log del servidor sin interrumpir el resto del job ni la notificación in-app.

### Transporte de correo (`server/src/services/mail.service.ts`)
- Usa `nodemailer` con las variables de entorno `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`. Si `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` no están configuradas, el servicio no envía correos (lo registra una sola vez en el log) pero no rompe el arranque del backend.
