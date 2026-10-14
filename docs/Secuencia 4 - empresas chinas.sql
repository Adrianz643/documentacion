-- Autor: Adrian Alejandro Vazquez Zambrano
-- Año: 2026

USE gdprod;


CREATE TABLE IF NOT EXISTS etapa_requisitos (
    id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    etapa_num   TINYINT UNSIGNED NOT NULL,
    codigo      VARCHAR(10)  NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    tipo_campo  ENUM('archivo','texto','numero','boolean') NOT NULL DEFAULT 'archivo',
    creado_por     INT UNSIGNED NULL,
    modificado_por INT UNSIGNED NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_etapa_req_codigo (etapa_num, codigo),
    INDEX idx_er_etapa (etapa_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS empresas_chinas (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo              VARCHAR(20)  NOT NULL,
    nombre              VARCHAR(180) NOT NULL,
    representante_legal VARCHAR(180) NULL,
    correo_electronico  VARCHAR(180) NULL,
    telefono            VARCHAR(30)  NULL,
    fecha_registro      DATE NULL,
    etapa_actual        TINYINT UNSIGNED NOT NULL DEFAULT 1,
    estado              ENUM('en_proceso','pendiente','finalizada','archivada') NOT NULL DEFAULT 'en_proceso',
    progreso_pct        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    creado_por          INT UNSIGNED NULL,
    modificado_por      INT UNSIGNED NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL,

    UNIQUE KEY uq_ec_codigo (codigo),
    INDEX idx_ec_estado (estado),
    INDEX idx_ec_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS empresa_china_requisitos (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_china_id INT UNSIGNED NOT NULL,
    requisito_id     SMALLINT UNSIGNED NOT NULL,
    documento_id     INT UNSIGNED NULL,
    valor_texto      TEXT NULL,
    completado       TINYINT(1) NOT NULL DEFAULT 0,
    creado_por       INT UNSIGNED NULL,
    modificado_por   INT UNSIGNED NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       DATETIME NULL,

    UNIQUE KEY uq_ecr (empresa_china_id, requisito_id),
    INDEX idx_ecr_deleted (deleted_at),
    CONSTRAINT fk_ecr_empresa   FOREIGN KEY (empresa_china_id) REFERENCES empresas_chinas(id) ON DELETE CASCADE,
    CONSTRAINT fk_ecr_requisito FOREIGN KEY (requisito_id)     REFERENCES etapa_requisitos(id),
    CONSTRAINT fk_ecr_documento FOREIGN KEY (documento_id)     REFERENCES documentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS empresa_china_etapa_checklist (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_china_id INT UNSIGNED NOT NULL,
    etapa_num        TINYINT UNSIGNED NOT NULL,
    completada       TINYINT(1) NOT NULL DEFAULT 0,
    completada_en    DATETIME NULL,
    creado_por       INT UNSIGNED NULL,
    modificado_por   INT UNSIGNED NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_ecec (empresa_china_id, etapa_num),
    CONSTRAINT fk_ecec_empresa FOREIGN KEY (empresa_china_id) REFERENCES empresas_chinas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO empresas (id, nombre, tipo, slug) VALUES
    (2, 'Empresas Chinas', 'china', 'empresas-chinas');

INSERT IGNORE INTO etapa_requisitos (etapa_num, codigo, descripcion, tipo_campo) VALUES
    (1, '1.1',  'Aprobación del nombre de la empresa',                             'archivo'),
    (1, '1.2',  'Una cuenta de correo electrónico',                                'texto'),
    (1, '1.3',  'Un número de teléfono celular mexicano',                          'texto'),
    (1, '1.4',  'Copia identificación de China de 2 accionistas',                  'archivo'),
    (1, '1.5',  'Escaneo a color del acta de matrimonio con apostilla',            'archivo'),
    (1, '1.6',  'Justificación de 2 representantes legales',                       'archivo'),
    (1, '1.7',  'Comprobante de domicilio de 2 representantes legales',            'archivo'),
    (1, '1.8',  'Constancia de situación fiscal de 2 representantes legales',      'archivo'),
    (1, '1.9',  'CURP de mexicanos',                                               'archivo'),
    (1, '1.10', 'Datos generales PLD',                                             'archivo'),
    (1, '1.11', 'Formato de notaria con los datos de la sociedad a constituir',    'archivo'),
    (1, '1.12', 'Actividad económica',                                             'archivo'),
    (1, '1.13', 'Carta poder',                                                     'archivo'),
    (1, '1.14', 'Traducción de certificado notarial apostillado',                  'archivo'),
    (1, '1.15', 'Comisario Mexicano: INE, RFC, CSP, comprobante',                  'archivo'),
    (1, '1.16', 'Nombre del representante legal en los estatutos sociales',        'texto'),
    (1, '1.17', 'Acta Constitutiva, Registro legal, Comercio Público',             'archivo'),
    (2, '2.1',  'Solicitud de RFC ante el SAT',                                    'archivo'),
    (2, '2.2',  'Cédula de identificación fiscal',                                 'archivo'),
    (2, '2.3',  'Constancia de situación fiscal',                                  'archivo'),
    (2, '2.4',  'Alta ante Hacienda',                                              'archivo'),
    (3, '3.1',  'Solicitud de firma electrónica',                                  'archivo'),
    (3, '3.2',  'Comparecencia ante el SAT',                                       'archivo'),
    (3, '3.3',  'Certificado de e.firma',                                          'archivo'),
    (3, '3.4',  'Contraseña del SAT',                                              'archivo'),
    (4, '4.1',  'Solicitud de apertura de cuenta',                                 'archivo'),
    (4, '4.2',  'Acta constitutiva',                                               'archivo'),
    (4, '4.3',  'Comprobante de domicilio fiscal',                                 'archivo'),
    (4, '4.4',  'Identificación de representante legal',                          'archivo'),
    (5, '5.1',  'Registro patronal ante el IMSS',                                  'archivo'),
    (5, '5.2',  'Inscripción al padrón de importadores',                          'archivo'),
    (5, '5.3',  'Trámites adicionales',                                           'archivo');


UPDATE etapa_requisitos SET tipo_campo = 'texto' WHERE etapa_num = 3 AND codigo = '3.4';

INSERT IGNORE INTO etapa_requisitos (etapa_num, codigo, descripcion, tipo_campo) VALUES
    (2, '2.5', 'Acta Constitutiva',      'archivo'),
    (3, '3.5', 'Certificado (.cer)',     'archivo'),
    (3, '3.6', 'Llave privada (.key)',   'archivo'),
    (3, '3.7', 'Contraseña capturable',  'texto');

DELETE FROM etapa_requisitos;
ALTER TABLE etapa_requisitos AUTO_INCREMENT = 1;

INSERT INTO tipos_documento (clave, nombre) VALUES
    ('REQUISITO_EMPRESA_CHINA', 'Requisito de Empresa China');

INSERT INTO etapa_requisitos (etapa_num, codigo, descripcion, tipo_campo) VALUES
    (1, '1.1',  'Aprobación del nombre de la empresa',                                            'archivo'),
    (1, '1.2',  'Una cuenta de correo electrónico',                                                'texto'),
    (1, '1.3',  'Un número de teléfono celular mexicano',                                          'texto'),
    (1, '1.4',  'Copia de Identificación China',                                                   'archivo'),
    (1, '1.5',  'Acta de Matrimonio apostillada',                                                  'archivo'),
    (1, '1.6',  'Identificación de representantes legales',                                        'archivo'),
    (1, '1.7',  'Comprobante de domicilio de representantes legales',                              'archivo'),
    (1, '1.8',  'Constancia de situación fiscal de los representantes legales',                    'archivo'),
    (1, '1.9',  'CURP Mexicano',                                                                   'archivo'),
    (1, '1.10', 'Datos Generales PLD',                                                              'archivo'),
    (1, '1.11', 'Formato de notaría con los datos de la sociedad a constituir',                    'archivo'),
    (1, '1.12', 'Actividad Económica',                                                              'archivo'),
    (1, '1.13', 'Carta Poder',                                                                      'archivo'),
    (1, '1.14', 'Traducción de Certificado notarial apostillado',                                  'archivo'),
    (1, '1.15', 'Comisionario Mexicano: INE CURP RFC comprobante',                                 'archivo'),
    (1, '1.16', 'Firma de representante legal en los estatus sociales',                            'texto'),
    (1, '1.17', 'Acta Constitutiva Registro Comercio Publico',                                     'archivo'),
    (2, '2.1',  'Agenda cita para tramitar el RFC',                                                 'archivo'),
    (2, '2.2',  'Acuse de cita impreso',                                                            'archivo'),
    (2, '2.3',  'Comprobante de domicilio de la empresa',                                           'archivo'),
    (2, '2.4',  'Acta constitutiva',                                                                'archivo'),
    (2, '2.5',  'Identificación del representante legal',                                           'archivo'),
    (2, '2.6',  'Una cuenta de correo electrónico',                                                 'texto'),
    (2, '2.7',  'Un número de teléfono celular mexicano',                                           'texto'),
    (2, '2.8',  'Situación fiscal',                                                                 'archivo'),
    (3, '3.1',  'Agenda cita de firma electrónica',                                                 'archivo'),
    (3, '3.2',  'Acuse de cita',                                                                    'archivo'),
    (3, '3.3',  'Constancia de situación fiscal de la empresa',                                    'archivo'),
    (3, '3.4',  'Comprobante de domicilio de la empresa',                                           'archivo'),
    (3, '3.5',  'Acta constitutiva',                                                                'archivo'),
    (3, '3.6',  'Identificación del representante legal',                                           'archivo'),
    (3, '3.7',  'Memoria USB',                                                                      'texto'),
    (3, '3.8',  'Un correo electrónico',                                                            'texto'),
    (3, '3.9',  'Un número de teléfono mexicano',                                                   'texto'),
    (3, '3.10', 'Un representante legal en México lleva los documentos necesarios a la autoridad fiscal para solicitar RFC', 'texto'),
    (3, '3.11', 'Firma electrónica de la empresa',                                                  'archivo'),
    (4, '4.1',  'Acta constitutiva',                                                                'archivo'),
    (4, '4.2',  'Constancia de situación fiscal',                                                   'archivo'),
    (4, '4.3',  'Pasaporte o tarjeta de residencia del representante legal',                       'archivo'),
    (4, '4.4',  'Comprobante de domicilio del representante legal',                                'archivo'),
    (4, '4.5',  'Comprobante de domicilio de la empresa',                                           'archivo'),
    (4, '4.6',  'Numero de celular para banca electrónica',                                         'texto'),
    (4, '4.7',  'Solicitud de cuenta bancaria',                                                     'archivo'),
    (4, '4.8',  'Cuenta bancario y banca móvil',                                                    'archivo'),
    (5, '5.1',  'Registro ante el IMSS',                                                            'archivo'),
    (5, '5.2',  'Registro nacional de inversiones extranjeras RNIE',                                'archivo'),
    (5, '5.3',  'Registro internos corporativos',                                                   'archivo');
