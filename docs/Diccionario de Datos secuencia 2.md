# Diccionario de Datos — Sistema de Gestión Documental (`gdprod`)
**Módulo:** ARDUM — Documentos Personales, FIEL, Declaraciones y Facturas
**Motor de Base de Datos:** MySQL 8.0 (InnoDB)
**Codificación / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Resumen de Tablas por Capa

| Capa | Tabla | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Capa 1** | `empresas` | Catálogo | Compañías dadas de alta en el aplicativo (ARDUM y, a futuro, Empresas Chinas). |
| **Capa 1** | `tipos_documento` | Catálogo | Clasificación de los archivos que se pueden radicar en un expediente. |
| **Capa 2** | `propietarios` | Maestra | Personas dueñas de un expediente documental dentro de una empresa. |
| **Capa 2** | `documentos` | Maestra | Archivos subidos al sistema (contratos, comprobantes, certificados, etc.). |
| **Capa 2** | `columnas_personalizadas` | Maestra | Columnas adicionales definidas por el usuario para las tablas de expedientes. |
| **Capa 3** | `documentos_personales` | Transaccional | Expediente personal de un propietario (contratos, CSF, acuse de cita). |
| **Capa 3** | `fiel_registros` | Transaccional | Firma Electrónica Avanzada (FIEL) de un propietario. |
| **Capa 3** | `declaraciones` | Transaccional | Declaraciones fiscales mensuales o en ceros de un propietario. |
| **Capa 3** | `facturas` | Transaccional | Facturas asociadas a un propietario. |
| **Capa 3** | `valores_columnas_personalizadas` | Relacional (N:M) | Valor capturado por propietario para cada columna personalizada. |

**Nota de alcance:** esta secuencia documenta únicamente lo relacionado con **ARDUM**. Las tablas de Empresas Chinas (`empresas_chinas`, `etapa_requisitos`, `empresa_china_requisitos`, `empresa_china_etapa_checklist`) y las de notificaciones/configuración no forman parte de esta secuencia.

**Convención de auditoría:** por decisión del autor, **todas** las tablas de esta secuencia incluyen `creado_por`, `modificado_por`, `created_at` y `updated_at`, incluso los catálogos (a diferencia de la Secuencia 1, donde los catálogos `cat_*` solo llevaban `created_at`).

---

## Capa 1 — Catálogos (Referenciales)

### 1. `empresas`
Compañías dadas de alta en el aplicativo. La fila `id = 1` corresponde a ARDUM.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la empresa. |
| `nombre` | `VARCHAR(150)` | NO | — | — | Razón social o nombre comercial. |
| `tipo` | `ENUM('nacional','china')` | NO | `'nacional'` | `idx_empresas_tipo` | Clasifica la empresa para enrutar su flujo documental (ARDUM usa `nacional`). |
| `slug` | `VARCHAR(160)` | NO | — | **UQ** | Identificador amigable usado en rutas del frontend (`ardum`). |
| `activa` | `TINYINT(1)` | NO | `1` | — | Bandera de disponibilidad operativa. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

### 2. `tipos_documento`
Catálogo de los tipos de archivo que puede contener un expediente ARDUM (contratos, comprobantes, insumos de la FIEL, etc.).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `SMALLINT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del tipo de documento. |
| `clave` | `VARCHAR(60)` | NO | — | **UQ** | Código nemotécnico (`CONTRATO_ARDUM`, `CSF`, `FIEL_CLAVE`, `COMPROBANTE`, …). |
| `nombre` | `VARCHAR(180)` | NO | — | — | Nombre legible mostrado en la interfaz. |
| `activo` | `TINYINT(1)` | NO | `1` | — | Bandera de disponibilidad del registro. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Capa 2 — Tablas Maestras (Propietarios, Documentos y Columnas)

### 3. `propietarios`
Personas físicas dueñas de un expediente documental dentro de una empresa (ARDUM).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del propietario. |
| `empresa_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia a `empresas(id)` (`ON DELETE RESTRICT`). |
| `nombre` | `VARCHAR(180)` | NO | — | — | Nombre completo del propietario. |
| `numero_lote` | `VARCHAR(20)` | SÍ | `NULL` | `idx_propietarios_numero_lote` | Número de lote asociado al propietario (agregado 2026-09-18 para Documentos Personales). |
| `curp` | `CHAR(18)` | SÍ | `NULL` | `idx_propietarios_curp` | CURP del propietario (opcional, a diferencia de `personas.curp`). |
| `email` | `VARCHAR(180)` | SÍ | `NULL` | — | Correo electrónico de contacto. |
| `telefono` | `VARCHAR(20)` | SÍ | `NULL` | — | Teléfono de contacto. |
| `activo` | `TINYINT(1)` | NO | `1` | — | Bandera de disponibilidad del registro. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_propietarios_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 4. `documentos`
Archivo físico subido al sistema, referenciado desde los distintos expedientes (contratos, comprobantes, certificados, etc.).

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del documento. |
| `empresa_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia a `empresas(id)` (`ON DELETE RESTRICT`). |
| `propietario_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `propietarios(id)` (`ON DELETE SET NULL`). |
| `tipo_documento_id` | `SMALLINT UNSIGNED` | NO | — | **FK** | Referencia a `tipos_documento(id)` (`ON DELETE RESTRICT`). |
| `nombre_archivo` | `VARCHAR(300)` | NO | — | — | Nombre original del archivo subido. |
| `ruta_storage` | `VARCHAR(500)` | NO | — | — | Ruta o clave del objeto en el almacenamiento de archivos. |
| `mime_type` | `VARCHAR(100)` | NO | — | — | Tipo MIME del archivo (`application/pdf`, `image/png`, …). |
| `tamano_bytes` | `INT UNSIGNED` | NO | — | — | Peso del archivo en bytes. |
| `subido_por` | `INT UNSIGNED` | NO | — | **FK** | Usuario que realizó la carga; referencia a `usuarios(id)` (`ON DELETE RESTRICT`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta (auditoría genérica). |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de carga del archivo. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_documentos_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 5. `columnas_personalizadas`
Columnas adicionales que un usuario puede agregar a las tablas de expedientes (Documentos Personales, FIEL, Declaraciones, Facturas) desde el gestor de columnas.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la columna. |
| `empresa_id` | `INT UNSIGNED` | NO | — | **FK** | Referencia a `empresas(id)` (`ON DELETE CASCADE`). |
| `seccion` | `VARCHAR(80)` | NO | — | `idx_colpers_empresa_seccion` | Pantalla a la que pertenece (`documentos_personales`, `fiel`, `declaraciones`, `facturas`). |
| `nombre` | `VARCHAR(120)` | NO | — | — | Etiqueta visible de la columna. |
| `tipo` | `ENUM('texto','numero','fecha','archivo','boolean')` | NO | `'texto'` | — | Tipo de dato que acepta la columna. |
| `orden` | `SMALLINT UNSIGNED` | NO | `0` | — | Posición de la columna dentro de la tabla. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_colpers_deleted` | Marca de borrado lógico de la columna. |

---

## Capa 3 — Expedientes ARDUM (Transaccionales)

### 6. `documentos_personales`
Expediente personal de un propietario: agrupa sus 4 documentos base.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del expediente. |
| `propietario_id` | `INT UNSIGNED` | NO | — | **FK** / **UQ** | Relación 1:1 con `propietarios(id)` (`ON DELETE CASCADE`). |
| `contrato_ardum_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `contrato_hegewisch_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `csf_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `acuse_cita_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_docpers_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 7. `fiel_registros`
Firma Electrónica Avanzada (FIEL) de un propietario.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del registro FIEL. |
| `propietario_id` | `INT UNSIGNED` | NO | — | **FK** / **UQ** | Relación 1:1 con `propietarios(id)` (`ON DELETE CASCADE`). |
| `clave_privada_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (archivo `.key`, `ON DELETE SET NULL`). |
| `certificado_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (archivo `.cer`, `ON DELETE SET NULL`). |
| `contrasena` | `VARCHAR(500)` | SÍ | `NULL` | — | Contraseña de la FIEL, cifrada (AES-256-GCM) por el backend; ya no se maneja como archivo (cambio 2026-09-18, antes `contrasena_id` referenciaba `documentos(id)`). |
| `fecha_creacion` | `DATE` | SÍ | `NULL` | — | Fecha de emisión de la FIEL. |
| `fecha_vencimiento` | `DATE` | SÍ | `NULL` | `idx_fiel_vencimiento` | Fecha de vencimiento de la FIEL. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_fiel_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 8. `declaraciones`
Declaraciones fiscales mensuales o en ceros de un propietario.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la declaración. |
| `propietario_id` | `INT UNSIGNED` | NO | — | **FK** / `idx_decl_propietario` | Referencia a `propietarios(id)` (`ON DELETE CASCADE`). |
| `tipo` | `ENUM('mensual','mensual_cero')` | NO | `'mensual'` | — | Clasifica la declaración (mesa "Mensuales" vs. "En ceros" en la UI). |
| `siguiente_pago_frecuencia` | `ENUM('mensual','bimestral','anual')` | NO | `'mensual'` | — | Periodicidad del siguiente pago. |
| `fecha_ultimo_pago` | `DATE` | SÍ | `NULL` | — | Fecha del último pago realizado. |
| `fecha_declaracion` | `DATE` | SÍ | `NULL` | — | Fecha en que se presentó la declaración. |
| `comprobante_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `periodo_mes` | `TINYINT UNSIGNED` | NO | — | `idx_decl_periodo` | Mes del periodo declarado (1–12). |
| `periodo_anio` | `YEAR` | NO | — | `idx_decl_periodo` | Año del periodo declarado. |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_decl_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 9. `facturas`
Facturas asociadas a un propietario.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único de la factura. |
| `propietario_id` | `INT UNSIGNED` | NO | — | **FK** / `idx_fact_propietario` | Referencia a `propietarios(id)` (`ON DELETE CASCADE`). |
| `fecha` | `DATE` | NO | — | `idx_fact_fecha` | Fecha de la factura. |
| `comprobante_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` (`ON DELETE SET NULL`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |
| `deleted_at` | `DATETIME` | SÍ | `NULL` | `idx_fact_deleted` | Marca de borrado lógico; alimenta el módulo de Papelera. |

---

### 10. `valores_columnas_personalizadas`
Resuelve la relación N:M entre columnas personalizadas y propietarios, guardando el valor capturado.

| Columna | Tipo de Dato | Nulo | Default | Llave / Índice | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | **PK** | Identificador único del valor. |
| `columna_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_vcp_columna_propietario` | Referencia a `columnas_personalizadas(id)` (`ON DELETE CASCADE`). |
| `propietario_id` | `INT UNSIGNED` | NO | — | **FK** / `uq_vcp_columna_propietario` | Referencia a `propietarios(id)` (`ON DELETE CASCADE`). |
| `valor_texto` | `TEXT` | SÍ | `NULL` | — | Valor capturado cuando la columna es de tipo texto, número, fecha o boolean. |
| `valor_documento_id` | `INT UNSIGNED` | SÍ | `NULL` | **FK** | Referencia a `documentos(id)` cuando la columna es de tipo archivo (`ON DELETE SET NULL`). |
| `creado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor del alta. |
| `modificado_por` | `INT UNSIGNED` | SÍ | `NULL` | — | ID del usuario autor de la última modificación. |
| `created_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Fecha y hora de alta del registro. |
| `updated_at` | `DATETIME` | NO | `CURRENT_TIMESTAMP` | — | Actualización automática ante cualquier cambio (`ON UPDATE`). |

---

## Semilla de Datos

- `empresas`: se inserta la fila `id = 1` (`ARDUM`, tipo `nacional`, slug `ardum`).
- `tipos_documento`: se insertan 8 claves — `CONTRATO_ARDUM`, `CONTRATO_HEGEWISCH`, `CSF`, `ACUSE_CITA`, `FIEL_CLAVE`, `FIEL_CERTIFICADO`, `FIEL_CONTRASENA`, `COMPROBANTE` — que cubren todos los tipos de archivo usados hoy en las pantallas de Documentos Personales, FIEL, Declaraciones y Facturas.

## Historial de cambios

- **2026-09-18:** se agregó la columna `numero_lote` (`VARCHAR(20)`, `NULL`) a `propietarios`, con el índice `idx_propietarios_numero_lote`, para mostrar y filtrar por número de lote en la pantalla de Documentos Personales.
- **2026-09-18:** en `fiel_registros` se eliminó `contrasena_id` (y su FK a `documentos`) y se agregó `contrasena` (`VARCHAR(500)`, `NULL`): la contraseña de la FIEL ya no se sube como archivo `.txt`, se captura en un input de texto y se guarda cifrada (AES-256-GCM) en el backend.
- **2026-09-18:** en `declaraciones` se eliminaron `pago_inicial`, `siguiente_pago_monto` y `monto_ultimo_pago`: ya no se capturan en "Nueva declaración" ni se muestran en las tablas ni en el detalle.

## Pendiente para una secuencia futura (Empresas Chinas)

Cuando se documente el módulo de Empresas Chinas, `valores_columnas_personalizadas` deberá ampliarse con una columna `empresa_china_id` (`NULL`, FK a `empresas_chinas(id)`) para admitir columnas personalizadas de ese módulo, ya que el gestor de columnas es compartido entre ambos módulos en el frontend.
