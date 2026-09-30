import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/database';
import type { ConfiguracionAlertaFielRow } from '../../types/db.types';

const DIAS_ANTICIPACION_DEFECTO = 3;
const ID_SINGLETON = 1;

export async function findAlertaFielDiasAnticipacion(): Promise<number> {
  const [rows] = await pool.execute<ConfiguracionAlertaFielRow[]>(
    `SELECT dias_anticipacion FROM configuracion_alertas_fiel WHERE id = ? LIMIT 1`,
    [ID_SINGLETON],
  );
  return rows[0]?.dias_anticipacion ?? DIAS_ANTICIPACION_DEFECTO;
}

export async function actualizarAlertaFielDiasAnticipacion(diasAnticipacion: number, actorId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO configuracion_alertas_fiel (id, dias_anticipacion, creado_por, modificado_por)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE dias_anticipacion = VALUES(dias_anticipacion), modificado_por = VALUES(modificado_por)`,
    [ID_SINGLETON, diasAnticipacion, actorId, actorId],
  );
}
