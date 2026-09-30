# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Subroles — control de acceso por módulo de negocio (ARDUM / ARDUM HL / Empresas Chinas)
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 1** | `subroles` | Catálogo | Módulos de negocio asignables (`ARDUM`, `ARDUM_HL`, `EMPRESAS_CHINAS`). |
| **Capa 2** | `usuario_subroles` | Relacional (N:M) | Asociación entre `usuarios` y `subroles`. |

**Motivación:** hasta la Secuencia 6, los permisos (`permisos`/`permisos_rol`, Secuencia 1) eran globales por rol — cualquier usuario con `documentos.leer`/`documentos.editar` podía consultar u operar en ARDUM, ARDUM HL (Facturas HL) y Empresas Chinas sin distinción. Esta secuencia agrega una segunda dimensión de autorización, ortogonal al rol, que aplica **únicamente** a los roles `editor` y `visor`/`Visor`: a qué módulo(s) de negocio tiene acceso ese usuario. Los roles `admin` y `superadmin` no usan subrol — mantienen acceso total a los tres módulos, igual que antes.

---

## Capa 1 — Catálogo

### 1. `subroles`
Catálogo fijo de los módulos de negocio que pueden restringirse por usuario.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `SMALLINT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del subrol. |
| `clave` | `VARCHAR(30)` | NO | — | **UQ** | Código estable usado por el backend y el JWT (`ARDUM`, `ARDUM_HL`, `EMPRESAS_CHINAS`). |
| `nombre` | `VARCHAR(60)` | NO | — | — | Nombre visible en el formulario de usuarios (`ARDUM`, `ARDUM HL`, `Empresas Chinas`). |
| `activo` | `TINYINT(1)` | NO | `1` | — | Estado operativo del subrol (`1` = Habilitado). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Capa 2 — Relacional

### 2. `usuario_subroles`
Resuelve la relación N:M entre usuarios y subroles: un usuario editor/visor puede tener uno, dos o los tres subroles.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del registro de asignación. |
| `usuario_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_usuario_subrol` | Referencia a `usuarios(id)` (`ON DELETE CASCADE`). |
| `subrol_id` | `SMALLINT UNSIGNED` | NO | — | **FK** / `uq_usuario_subrol` | Referencia a `subroles(id)` (`ON DELETE CASCADE`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario (admin/superadmin) que hizo la asignación. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del último usuario que modificó la asignación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de vinculación. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Semilla de Datos

- `subroles`: 3 filas — `ARDUM`, `ARDUM_HL` ("ARDUM HL"), `EMPRESAS_CHINAS` ("Empresas Chinas").
- `usuario_subroles`: migración única (2026-09-19) que otorgó los 3 subroles a las cuentas `editor`/`visor` que ya existían antes de este control (`alexvazquez`, `viewer.demo`), para no dejarlas bloqueadas de golpe. Cuentas nuevas exigen la selección explícita desde el formulario.

## Reglas de negocio (aplicadas en aplicación, no en la BD)

- **Alta/edición de usuario** (`server/src/modules/usuarios/usuarios.service.ts`): si el rol resuelto (`roles.nombre`) es `editor` o `visor`/`Visor`, se exige al menos un subrol (HTTP 400 si viene vacío). Si el rol es `admin` o `superadmin`, cualquier subrol enviado se descarta silenciosamente y no se persiste ninguna fila en `usuario_subroles` (se eliminan las que hubiera si el usuario cambió de rol).
- **JWT** (`server/src/utils/jwt.ts`, `AuthTokenPayload.subroles: string[]`): el token incluye las claves de subrol vigentes del usuario, calculadas en el login.
- **Autorización por módulo** (`server/src/middlewares/subrol.middleware.ts`, `requireSubrol(clave)`): `admin`/`superadmin` pasan siempre; `editor`/`visor` requieren que `clave` esté en `req.auth.subroles`, si no, `403`. Se aplica en las rutas de:
  - `ARDUM`: `propietarios`, `documentos-personales`, `fiel`, `declaraciones`, `facturas`.
  - `ARDUM_HL`: `facturas-hl`.
  - `EMPRESAS_CHINAS`: `empresas-chinas`.
  - `columnas-personalizadas` (compartido por ARDUM y Empresas Chinas): se valida dinámicamente según el `empresaId` recibido (1 → ARDUM, 2 → EMPRESAS_CHINAS).
  - `papelera`: la lista y las operaciones de restaurar/eliminar/vaciar excluyen o rechazan los módulos (`documentos-personales`, `fiel`, `declaraciones`, `facturas`, `facturas-hl`, `empresas-chinas`) fuera de los subroles del usuario, salvo admin/superadmin.
- **Frontend**: el menú lateral (`sidebar-nav.component.ts`) oculta las ramas de ARDUM/ARDUM HL/Empresas Chinas que el usuario no tenga asignadas, y las rutas correspondientes (`app.routes.ts`) llevan un guard (`subrolGuard`) como segunda barrera ante navegación directa por URL.
