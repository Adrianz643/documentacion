import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import type {
  EmpresaChinaChecklistRow,
  EmpresaChinaRequisitoValorRow,
  EmpresaChinaRow,
  EtapaRequisitoRow,
} from '../../types/db.types';
import type { CrearEmpresaChinaInput } from './empresas-chinas.types';

const TIPO_DOCUMENTO_CLAVE = 'REQUISITO_EMPRESA_CHINA';

interface TipoDocumentoIdRow extends RowDataPacket {
  id: number;
}

interface RutaStorageRow extends RowDataPacket {
  ruta_storage: string;
}

interface ValorActualRow extends RowDataPacket {
  id: number;
  documento_id: number | null;
}

interface ProgresoRow extends RowDataPacket {
  total: number;
  completados: number;
}

const VALOR_JOIN = `
  SELECT
    ecr.id,
    ecr.empresa_china_id,
    ecr.requisito_id,
    er.codigo             AS requisito_codigo,
    er.etapa_num,
    ecr.documento_id,
    ecr.valor_texto,
    ecr.completado,
    d.tipo_documento_id   AS doc_tipo_id,
    d.nombre_archivo      AS doc_nombre,
    d.ruta_storage        AS doc_ruta,
    d.mime_type           AS doc_mime,
    d.tamano_bytes        AS doc_tam,
    d.subido_por          AS doc_subido_por,
    d.created_at          AS doc_creado
  FROM empresa_china_requisitos ecr
  INNER JOIN etapa_requisitos er ON er.id = ecr.requisito_id
  LEFT JOIN documentos d ON d.id = ecr.documento_id
  WHERE ecr.deleted_at IS NULL
`;

export async function findRequisitosPorEtapa(etapaNum: number): Promise<EtapaRequisitoRow[]> {
  const [rows] = await pool.execute<EtapaRequisitoRow[]>(
    `SELECT id, etapa_num, codigo, descripcion, tipo_campo FROM etapa_requisitos WHERE etapa_num = ? ORDER BY codigo`,
    [etapaNum],
  );
  return rows;
}

export async function findTodosRequisitos(): Promise<EtapaRequisitoRow[]> {
  const [rows] = await pool.execute<EtapaRequisitoRow[]>(
    `SELECT id, etapa_num, codigo, descripcion, tipo_campo FROM etapa_requisitos ORDER BY etapa_num, codigo`,
  );
  return rows;
}

export async function findRequisitoPorCodigo(codigo: string): Promise<EtapaRequisitoRow | null> {
  const [rows] = await pool.execute<EtapaRequisitoRow[]>(
    `SELECT id, etapa_num, codigo, descripcion, tipo_campo FROM etapa_requisitos WHERE codigo = ? LIMIT 1`,
    [codigo],
  );
  return rows[0] ?? null;
}

export async function findEmpresasActivas(): Promise<EmpresaChinaRow[]> {
  const [rows] = await pool.execute<EmpresaChinaRow[]>(
    `SELECT id, codigo, nombre, representante_legal, correo_electronico, telefono, fecha_registro,
            etapa_actual, estado, progreso_pct, created_at, updated_at
     FROM empresas_chinas WHERE deleted_at IS NULL ORDER BY nombre`,
  );
  return rows;
}

export interface ConteoPorEtapaYEstadoRow extends RowDataPacket {
  etapa_actual: number;
  estado: string;
  total: number;
}

export async function countPorEtapaYEstado(): Promise<ConteoPorEtapaYEstadoRow[]> {
  const [rows] = await pool.execute<ConteoPorEtapaYEstadoRow[]>(
    `SELECT etapa_actual, estado, COUNT(*) AS total
     FROM empresas_chinas
     WHERE deleted_at IS NULL
     GROUP BY etapa_actual, estado`,
  );
  return rows;
}

export async function findEmpresaById(id: number): Promise<EmpresaChinaRow | null> {
  const [rows] = await pool.execute<EmpresaChinaRow[]>(
    `SELECT id, codigo, nombre, representante_legal, correo_electronico, telefono, fecha_registro,
            etapa_actual, estado, progreso_pct, created_at, updated_at
     FROM empresas_chinas WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findValoresPorEtapa(etapaNum: number): Promise<EmpresaChinaRequisitoValorRow[]> {
  const [rows] = await pool.execute<EmpresaChinaRequisitoValorRow[]>(
    `${VALOR_JOIN} AND er.etapa_num = ?`,
    [etapaNum],
  );
  return rows;
}

export async function findValoresPorEmpresa(empresaChinaId: number): Promise<EmpresaChinaRequisitoValorRow[]> {
  const [rows] = await pool.execute<EmpresaChinaRequisitoValorRow[]>(
    `${VALOR_JOIN} AND ecr.empresa_china_id = ?`,
    [empresaChinaId],
  );
  return rows;
}

export async function findChecklistPorEtapa(etapaNum: number): Promise<EmpresaChinaChecklistRow[]> {
  const [rows] = await pool.execute<EmpresaChinaChecklistRow[]>(
    `SELECT empresa_china_id, etapa_num, completada, completada_en
     FROM empresa_china_etapa_checklist WHERE etapa_num = ?`,
    [etapaNum],
  );
  return rows;
}

export async function findChecklistPorEmpresa(empresaChinaId: number): Promise<EmpresaChinaChecklistRow[]> {
  const [rows] = await pool.execute<EmpresaChinaChecklistRow[]>(
    `SELECT empresa_china_id, etapa_num, completada, completada_en
     FROM empresa_china_etapa_checklist WHERE empresa_china_id = ?`,
    [empresaChinaId],
  );
  return rows;
}

export async function crear(input: CrearEmpresaChinaInput, actorId: number): Promise<number> {
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const codigoTemporal = `TEMP-${Date.now()}`;
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO empresas_chinas (
         codigo, nombre, representante_legal, correo_electronico, telefono, fecha_registro,
         creado_por, modificado_por
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoTemporal,
        input.nombre,
        input.representanteLegal,
        input.correoElectronico,
        input.telefono,
        input.fechaRegistro,
        actorId,
        actorId,
      ],
    );
    const id = result.insertId;
    const codigo = `CH-${String(id).padStart(4, '0')}`;

    await connection.execute<ResultSetHeader>(
      `UPDATE empresas_chinas SET codigo = ? WHERE id = ?`,
      [codigo, id],
    );

    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE empresas_chinas SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
    [actorId, id],
  );
}

export async function upsertChecklist(
  empresaChinaId: number,
  etapaNum: number,
  completada: boolean,
  actorId: number,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO empresa_china_etapa_checklist (empresa_china_id, etapa_num, completada, completada_en, creado_por, modificado_por)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE completada = VALUES(completada), completada_en = VALUES(completada_en), modificado_por = VALUES(modificado_por)`,
    [empresaChinaId, etapaNum, completada ? 1 : 0, completada ? new Date() : null, actorId, actorId],
  );
}

export async function findTipoDocumentoRequisito(): Promise<number | null> {
  const [rows] = await pool.execute<TipoDocumentoIdRow[]>(
    `SELECT id FROM tipos_documento WHERE clave = ? AND activo = 1 LIMIT 1`,
    [TIPO_DOCUMENTO_CLAVE],
  );
  return rows[0]?.id ?? null;
}

export async function findValorActual(
  empresaChinaId: number,
  requisitoId: number,
): Promise<ValorActualRow | null> {
  const [rows] = await pool.execute<ValorActualRow[]>(
    `SELECT id, documento_id FROM empresa_china_requisitos
     WHERE empresa_china_id = ? AND requisito_id = ? AND deleted_at IS NULL LIMIT 1`,
    [empresaChinaId, requisitoId],
  );
  return rows[0] ?? null;
}

export async function upsertValorArchivo(
  empresaChinaId: number,
  requisitoId: number,
  documentoId: number,
  actorId: number,
): Promise<{ anteriorDocumentoId: number | null; anteriorRutaStorage: string | null }> {
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [actualRows] = await connection.execute<ValorActualRow[]>(
      `SELECT id, documento_id FROM empresa_china_requisitos
       WHERE empresa_china_id = ? AND requisito_id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [empresaChinaId, requisitoId],
    );
    const anteriorDocumentoId = actualRows[0]?.documento_id ?? null;

    let anteriorRutaStorage: string | null = null;
    if (anteriorDocumentoId) {
      const [docRows] = await connection.execute<RutaStorageRow[]>(
        `SELECT ruta_storage FROM documentos WHERE id = ? LIMIT 1`,
        [anteriorDocumentoId],
      );
      anteriorRutaStorage = docRows[0]?.ruta_storage ?? null;
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO empresa_china_requisitos (empresa_china_id, requisito_id, documento_id, completado, creado_por, modificado_por)
       VALUES (?, ?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE documento_id = VALUES(documento_id), completado = 1, deleted_at = NULL, modificado_por = VALUES(modificado_por)`,
      [empresaChinaId, requisitoId, documentoId, actorId, actorId],
    );

    if (anteriorDocumentoId) {
      await connection.execute<ResultSetHeader>(
        `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
        [actorId, anteriorDocumentoId],
      );
    }

    await connection.commit();
    return { anteriorDocumentoId, anteriorRutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function upsertValorTexto(
  empresaChinaId: number,
  requisitoId: number,
  valorTexto: string,
  actorId: number,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO empresa_china_requisitos (empresa_china_id, requisito_id, valor_texto, completado, creado_por, modificado_por)
     VALUES (?, ?, ?, 1, ?, ?)
     ON DUPLICATE KEY UPDATE valor_texto = VALUES(valor_texto), completado = 1, deleted_at = NULL, modificado_por = VALUES(modificado_por)`,
    [empresaChinaId, requisitoId, valorTexto, actorId, actorId],
  );
}

export async function eliminarValor(
  empresaChinaId: number,
  requisitoId: number,
  actorId: number,
): Promise<{ rutaStorage: string | null }> {
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [actualRows] = await connection.execute<ValorActualRow[]>(
      `SELECT id, documento_id FROM empresa_china_requisitos
       WHERE empresa_china_id = ? AND requisito_id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [empresaChinaId, requisitoId],
    );
    const actual = actualRows[0];

    let rutaStorage: string | null = null;
    if (actual) {
      if (actual.documento_id) {
        const [docRows] = await connection.execute<RutaStorageRow[]>(
          `SELECT ruta_storage FROM documentos WHERE id = ? LIMIT 1`,
          [actual.documento_id],
        );
        rutaStorage = docRows[0]?.ruta_storage ?? null;
        await connection.execute<ResultSetHeader>(
          `UPDATE documentos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
          [actorId, actual.documento_id],
        );
      }
      await connection.execute<ResultSetHeader>(
        `UPDATE empresa_china_requisitos SET deleted_at = NOW(), modificado_por = ? WHERE id = ?`,
        [actorId, actual.id],
      );
    }

    await connection.commit();
    return { rutaStorage };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function recalcularProgreso(empresaChinaId: number, actorId: number): Promise<void> {
  const [empresaRows] = await pool.execute<RowDataPacket[]>(
    `SELECT etapa_actual FROM empresas_chinas WHERE id = ? LIMIT 1`,
    [empresaChinaId],
  );
  const etapaActual = empresaRows[0]?.etapa_actual as number | undefined;
  if (!etapaActual) return;

  const [progresoRows] = await pool.execute<ProgresoRow[]>(
    `SELECT
       (SELECT COUNT(*) FROM etapa_requisitos WHERE etapa_num = ?) AS total,
       (SELECT COUNT(*) FROM empresa_china_requisitos ecr
          INNER JOIN etapa_requisitos er ON er.id = ecr.requisito_id
          WHERE er.etapa_num = ? AND ecr.empresa_china_id = ? AND ecr.completado = 1 AND ecr.deleted_at IS NULL) AS completados`,
    [etapaActual, etapaActual, empresaChinaId],
  );
  const { total, completados } = progresoRows[0] ?? { total: 0, completados: 0 };
  const progresoPct = total > 0 ? Math.round((completados / total) * 100) : 0;

  await pool.execute<ResultSetHeader>(
    `UPDATE empresas_chinas SET progreso_pct = ?, modificado_por = ? WHERE id = ?`,
    [progresoPct, actorId, empresaChinaId],
  );
}
