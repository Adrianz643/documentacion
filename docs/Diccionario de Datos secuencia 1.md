# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** Identidad, Autenticación y Autorización (IAM / RBAC)  
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)  
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 1** | `cat_paises` | Catálogo | Referencia geográfica bajo norma ISO 3166-1 alpha-2. |
| **Capa 1** | `cat_tipos_documento` | Catálogo | Tipos de identificación civil admitidos. |
| **Capa 1** | `cat_estados_usuario` | Catálogo | Estados de ciclo de vida de las cuentas de usuario. |
| **Capa 2** | `personas` | Maestra | Información civil y datos de contacto de personas físicas. |
| **Capa 2** | `roles` | Maestra | Roles de autorización dentro del modelo RBAC. |
| **Capa 2** | `permisos` | Maestra | Privilegios granulares clasificados por módulo y acción. |
| **Capa 2** | `permisos_rol` | Relacional (N:M) | Asociación distributiva entre roles y permisos. |
| **Capa 2** | `usuarios` | Maestra | Cuentas del sistema con credenciales criptográficas. |
| **Capa 2** | `usuarios_hist` | Histórica | Trazabilidad inmutable de versiones de cuentas de usuario. |
| **Capa 3** | `sesiones` | Transaccional | Control, vigencia y expiración de tokens de acceso activos. |
| **Capa 3** | `intentos_login` | Transaccional | Registro de intentos de autenticación y prevención de fuerza bruta. |
| **Capa 3** | `auditoria_cambios` | Transaccional | Bitácora forense de mutaciones de datos en formato JSON. |

---

## Capa 1 — Catálogos (Referenciales)

### 1. `cat_paises`
Almacena la codificación internacional de países. Es de solo lectura operativa.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del país. |
| `codigo_iso` | `CHAR(2)` | NO | — | **UQ** | Código estándar de dos letras (ej. 'MX', 'US', 'ES'). |
| `nombre` | `VARCHAR(100)` | NO | — | **UQ** | Nombre oficial del país. |
| `activo` | `TINYINT(1)` | NO | `1` | — | Estado lógico (`1` = Activo, `0` = Inactivo). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |

---

### 2. `cat_tipos_documento`
Clasifica los documentos de identidad oficiales reconocidos para las personas.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del tipo de documento. |
| `clave` | `VARCHAR(20)` | NO | — | **UQ** | Código nemotécnico institucional ('CURP', 'INE', 'PASAPORTE'). |
| `nombre` | `VARCHAR(100)` | NO | — | — | Nombre legible del documento. |
| `descripcion` | `VARCHAR(255)` | SÍ | `NULL` | — | Descripción complementaria o propósito normativo. |
| `activo` | `TINYINT(1)` | NO | `1` | — | Bandera de disponibilidad del registro (`1` = Activo). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |

---

### 3. `cat_estados_usuario`
Define los estados admisibles para el control de acceso de las cuentas.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador primario del estado. |
| `clave` | `VARCHAR(30)` | NO | — | **UQ** | Clave unívoca (`ACTIVO`, `BLOQUEADO`, `INACTIVO`, `ELIMINADO`). |
| `nombre` | `VARCHAR(60)` | NO | — | — | Nombre visible en interfaces gráficas. |
| `descripcion` | `VARCHAR(255)` | SÍ | `NULL` | — | Explicación del impacto operativo de este estado. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de registro. |

---

## Capa 2 — Tablas Maestras (RBAC, Personas y Cuentas)

### 4. `personas`
Entidad principal de identidad civil. Contiene los datos de las personas físicas que operan el aplicativo.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la persona física. |
| `tipo_documento_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia foránea a `cat_tipos_documento(id)`. |
| `pais_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia foránea a `cat_paises(id)`. |
| `nombre` | `VARCHAR(100)` | NO | — | `idx_nombre` | Nombre(s) de la persona. |
| `apellido_paterno` | `VARCHAR(100)` | NO | — | `idx_nombre` | Primer apellido. |
| `apellido_materno` | `VARCHAR(100)` | NO | — | `idx_nombre` | Segundo apellido. |
| `fecha_nacimiento` | `DATE` | NO | — | — | Fecha de nacimiento. |
| `curp` | `CHAR(18)` | NO | — | **UQ** | Clave Única de Registro de Población. |
| `rfc` | `VARCHAR(13)` | SÍ | `NULL` | — | Registro Federal de Contribuyentes (con homoclave opcional). |
| `email` | `VARCHAR(255)` | NO | — | **UQ** / `idx_email` | Dirección de correo electrónico única. |
| `telefono` | `VARCHAR(20)` | SÍ | `NULL` | — | Número de contacto telefónico fijo o móvil. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la creación (auditoría). |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Marca de tiempo de inserción. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_deleted` | Marca de tiempo para borrado lógico (*soft-delete*). |

---

### 5. `roles`
Perfiles que agrupan privilegios de acceso para la autorización.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del rol. |
| `nombre` | `VARCHAR(50)` | NO | — | **UQ** | Nombre del rol (`superadmin`, `admin`, `editor`, `Visor`). |
| `descripcion` | `VARCHAR(255)` | SÍ | `NULL` | — | Descripción funcional de las capacidades del rol. |
| `activo` | `TINYINT(1)` | NO | `1` | — | Estado operativo del rol (`1` = Habilitado). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID de usuario creador. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del último usuario que actualizó el rol. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Marca temporal de creación. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Marca temporal de última modificación. |

---

### 6. `permisos`
Catálogo atómico de capacidades operativas segregadas por módulo y verbo.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador primario del permiso. |
| `nombre` | `VARCHAR(100)` | NO | — | **UQ** | Código unívoco (`modulo.accion`, ej. `usuarios.crear`). |
| `modulo` | `VARCHAR(50)` | NO | — | `uq_modulo_accion` | Nombre del módulo (`AUTH`, `USUARIOS`, `DOCUMENTOS`). |
| `accion` | `VARCHAR(50)` | NO | — | `uq_modulo_accion` | Operación ejecutada (`LOGIN`, `CREAR`, `LEER`, `EDITAR`). |
| `descripcion` | `VARCHAR(255)` | SÍ | `NULL` | — | Explicación del privilegio otorgado. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID de usuario creador. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Marca de tiempo de registro. |

---

### 7. `permisos_rol`
Tabla asociativa que resuelve la relación muchos a muchos (N:M) entre roles y permisos.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del registro de asignación. |
| `rol_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_rol_permiso` | Referencia foránea a `roles(id)` (`ON DELETE CASCADE`). |
| `permiso_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_rol_permiso` | Referencia foránea a `permisos(id)` (`ON DELETE CASCADE`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario que realizó la asignación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de vinculación. |

---

### 8. `usuarios`
Cuentas de acceso que contienen los hashes de credenciales, contadores de seguridad y enlaces identitarios.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador unívoco del usuario en el sistema. |
| `persona_id` | `INT UNSIGNED` | NO | — | **FK** / **UQ** | Relación 1:1 con `personas(id)` (`ON DELETE RESTRICT`). |
| `rol_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia foránea a `roles(id)` (`ON DELETE RESTRICT`). |
| `estado_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia foránea a `cat_estados_usuario(id)`. |
| `username` | `VARCHAR(50)` | NO | — | **UQ** / `idx_username` | Nombre de cuenta para el inicio de sesión. |
| `password_hash` | `VARCHAR(255)` | NO | — | — | Cadena hash derivada (compatible con BCrypt/Argon2). |
| `salt` | `VARCHAR(64)` | SÍ | `NULL` | — | Salt específico si se requiere digest externo. |
| `intentos_fallidos` | `TINYINT` | NO | `0` | — | Contador acumulador de fallos de contraseña. |
| `bloqueado_hasta` | `DATETIME` | SÍ | `NULL` | — | Fecha límite del bloqueo preventivo por fuerza bruta. |
| `ultimo_login` | `DATETIME` | SÍ | `NULL` | — | Registro del último inicio de sesión exitoso. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario autor de la última actualización. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de creación de la cuenta. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática del registro (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_deleted` | Marca temporal para borrado lógico (*soft-delete*). |

---

### 9. `usuarios_hist`
Tabla histórica inmutable alimentada automáticamente mediante triggers (`BEFORE UPDATE` y `BEFORE DELETE`).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del evento histórico. |
| `usuario_id` | `INT UNSIGNED` | NO | — | **FK** / `idx_usuario` | Cuenta afectada en `usuarios(id)` (`ON DELETE CASCADE`). |
| `rol_id` | `INT UNSIGNED` | NO | — | — | Rol que poseía antes de la modificación (`OLD.rol_id`). |
| `estado_id` | `INT UNSIGNED` | NO | — | — | Estado previo de la cuenta (`OLD.estado_id`). |
| `password_hash` | `VARCHAR(255)` | NO | — | — | Hash previo de contraseña (`OLD.password_hash`). |
| `salt` | `VARCHAR(64)` | SÍ | `NULL` | — | Salt previo (`OLD.salt`). |
| `intentos_fallidos` | `TINYINT` | NO | — | — | Contador previo (`OLD.intentos_fallidos`). |
| `bloqueado_hasta` | `DATETIME` | SÍ | `NULL` | — | Vigencia de bloqueo previa (`OLD.bloqueado_hasta`). |
| `operacion` | `ENUM('UPDATE','DELETE')` | NO | — | — | Tipo de evento DML detonante. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | Usuario responsable de detonar el cambio. |
| `fecha_operacion` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Instante en que se generó la versión histórica. |

---

## Capa 3 — Tablas Transaccionales (Eventos Append-Only)

### 10. `sesiones`
Persiste los tokens de autenticación para control de revocación y vigencia.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la sesión. |
| `usuario_id` | `INT UNSIGNED` | NO | — | **FK** / `idx_usuario` | Referencia foránea a `usuarios(id)` (`ON DELETE CASCADE`). |
| `token` | `VARCHAR(255)` | NO | — | **UQ** / `idx_token` | Huella, firma criptográfica o identificador único del token (`jti`). |
| `ip_address` | `VARCHAR(45)` | SÍ | `NULL` | — | Dirección IP del cliente (soporta IPv4 e IPv6). |
| `user_agent` | `VARCHAR(512)` | SÍ | `NULL` | — | Cabecera User-Agent del navegador o cliente HTTP. |
| `expira_en` | `DATETIME` | NO | — | `idx_expira_en` | Fecha y hora máxima de caducidad de la sesión. |
| `cerrada_en` | `DATETIME` | SÍ | `NULL` | `idx_usuario` | Fecha y hora efectiva del término de la sesión. |
| `motivo_cierre` | `ENUM('LOGOUT','EXPIRACION','ADMIN','OTRO')` | SÍ | `NULL` | — | Causa que originó el cierre o revocación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de emisión de la sesión. |

---

### 11. `intentos_login`
Bitácora perimetral para detección de intrusiones, auditoría de accesos y mitigación de ataques por diccionario.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador secuencial del intento de acceso. |
| `usuario_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** / `idx_usuario_fecha` | ID de usuario si el username existía; `NULL` si no existía (`ON DELETE SET NULL`). |
| `exitoso` | `TINYINT(1)` | NO | `0` | — | Resultado del intento (`1` = Autorizado, `0` = Rechazado). |
| `ip_address` | `VARCHAR(45)` | SÍ | `NULL` | `idx_ip_fecha` | Dirección IP de la máquina solicitante. |
| `user_agent` | `VARCHAR(512)` | SÍ | `NULL` | — | Información del navegador o aplicación origen. |
| `descripcion` | `VARCHAR(255)` | SÍ | `NULL` | — | Motivo del rechazo (ej. `Password inválido`, `Cuenta bloqueada`). |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | `idx_usuario_fecha`, `idx_ip_fecha` | Momento exacto del intento de conexión. |

---

### 12. `auditoria_cambios`
Registro forense transversal para rastrear cambios en entidades clave mediante snapshots JSON.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador de la traza de auditoría. |
| `tabla_nombre` | `VARCHAR(64)` | NO | — | `idx_tabla_registro` | Nombre de la tabla sobre la cual ocurrió la mutación. |
| `registro_id` | `INT UNSIGNED` | NO | — | `idx_tabla_registro` | Llave primaria del registro alterado. |
| `operacion` | `ENUM('INSERT','UPDATE','DELETE')` | NO | — | — | Operación ejecutada en base de datos. |
| `datos_anteriores` | `JSON` | SÍ | `NULL` | — | Estado de los campos antes del cambio (`NULL` en INSERT). |
| `datos_nuevos` | `JSON` | SÍ | `NULL` | — | Estado de los campos después del cambio (`NULL` en DELETE). |
| `usuario_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** / `idx_usuario` | Usuario responsable de la transacción (`ON DELETE SET NULL`). |
| `ip_address` | `VARCHAR(45)` | SÍ | `NULL` | — | Dirección IP desde donde se ejecutó la solicitud. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | `idx_fecha` | Momento preciso de la persistencia de la traza. |