import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/database';
import { eliminarArchivoFisico } from '../../utils/fileStorage';
import type { ModuloPapelera } from './papelera.types';

export interface PapeleraRawRow extends RowDataPacket {
  id: number;
  nombre: string;
  deleted_at: Date;
  eliminado_por: string | null;
}

const TABLA_POR_MODULO: Record<ModuloPapelera, string> = {
  'documentos-personales': 'documentos_personales',
  fiel: 'fiel_registros',
  declaraciones: 'declaraciones',
  facturas: 'facturas',
  'facturas-hl': 'facturas_hl',
  'empresas-chinas': 'empresas_chinas',
  usuarios: 'usuarios',
  documentos: 'documentos',
};

export function esModuloValido(modulo: string): modulo is ModuloPapelera {
  return Object.prototype.hasOwnProperty.call(TABLA_POR_MODULO, modulo);
}

export async function findDocumentosPersonalesEliminados(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND dp.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT dp.id, p.nombre AS nombre, dp.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM documentos_personales dp
     JOIN propietarios p ON p.id = dp.propietario_id
     LEFT JOIN usuarios ub ON ub.id = dp.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE dp.deleted_at IS NOT NULL ${filtro}
     ORDER BY dp.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findFielEliminados(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND fr.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT fr.id, p.nombre AS nombre, fr.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM fiel_registros fr
     JOIN propietarios p ON p.id = fr.propietario_id
     LEFT JOIN usuarios ub ON ub.id = fr.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE fr.deleted_at IS NOT NULL ${filtro}
     ORDER BY fr.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findDeclaracionesEliminadas(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND d.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT d.id, CONCAT(p.nombre, ' — ', d.periodo_mes, '/', d.periodo_anio) AS nombre, d.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM declaraciones d
     JOIN propietarios p ON p.id = d.propietario_id
     LEFT JOIN usuarios ub ON ub.id = d.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE d.deleted_at IS NOT NULL ${filtro}
     ORDER BY d.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findFacturasEliminadas(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND f.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT f.id, CONCAT(p.nombre, ' — ', DATE_FORMAT(f.fecha, '%d/%m/%Y')) AS nombre, f.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM facturas f
     JOIN propietarios p ON p.id = f.propietario_id
     LEFT JOIN usuarios ub ON ub.id = f.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE f.deleted_at IS NOT NULL ${filtro}
     ORDER BY f.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findFacturasHlEliminadas(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND f.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT f.id, CONCAT(f.cliente, ' — ', DATE_FORMAT(f.fecha, '%d/%m/%Y')) AS nombre, f.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM facturas_hl f
     LEFT JOIN usuarios ub ON ub.id = f.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE f.deleted_at IS NOT NULL ${filtro}
     ORDER BY f.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findEmpresasChinasEliminadas(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND ec.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT ec.id, ec.nombre AS nombre, ec.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM empresas_chinas ec
     LEFT JOIN usuarios ub ON ub.id = ec.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE ec.deleted_at IS NOT NULL ${filtro}
     ORDER BY ec.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findUsuariosEliminados(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND u.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT u.id, CONCAT(p.nombre, ' ', p.apellido_paterno, ' (', u.username, ')') AS nombre, u.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM usuarios u
     JOIN personas p ON p.id = u.persona_id
     LEFT JOIN usuarios ub ON ub.id = u.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE u.deleted_at IS NOT NULL ${filtro}
     ORDER BY u.deleted_at DESC`,
    params,
  );
  return rows;
}

export async function findDocumentosEliminados(soloUsuarioId?: number): Promise<PapeleraRawRow[]> {
  const params: Array<string | number> = [];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND d.modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [rows] = await pool.execute<PapeleraRawRow[]>(
    `SELECT d.id, d.nombre_archivo AS nombre, d.deleted_at,
            CONCAT(pb.nombre, ' ', pb.apellido_paterno) AS eliminado_por
     FROM documentos d
     LEFT JOIN usuarios ub ON ub.id = d.modificado_por
     LEFT JOIN personas pb ON pb.id = ub.persona_id
     WHERE d.deleted_at IS NOT NULL ${filtro}
     ORDER BY d.deleted_at DESC`,
    params,
  );
  return rows;
}

interface RutaStorageRow extends RowDataPacket {
  ruta_storage: string;
}

interface DocumentoOrigenRow extends RowDataPacket {
  propietario_id: number | null;
  tipo_clave: string;
}

interface CandidatoSlotRow extends RowDataPacket {
  id: number;
}

// Por cada clave de tipos_documento, en que tabla(s)/columna vive el slot que la referencia.
// 'COMPROBANTE' es ambigua a proposito: declaraciones y facturas comparten el mismo tipo de
// documento en el catalogo, asi que se buscan candidatos en ambas tablas.
const SLOTS_POR_CLAVE: Record<string, Array<{ tabla: string; columna: string }>> = {
  CONTRATO_ARDUM: [{ tabla: 'documentos_personales', columna: 'contrato_ardum_id' }],
  CONTRATO_HEGEWISCH: [{ tabla: 'documentos_personales', columna: 'contrato_hegewisch_id' }],
  CSF: [{ tabla: 'documentos_personales', columna: 'csf_id' }],
  ACUSE_CITA: [{ tabla: 'documentos_personales', columna: 'acuse_cita_id' }],
  FIEL_CLAVE: [{ tabla: 'fiel_registros', columna: 'clave_privada_id' }],
  FIEL_CERTIFICADO: [{ tabla: 'fiel_registros', columna: 'certificado_id' }],
  COMPROBANTE: [
    { tabla: 'declaraciones', columna: 'comprobante_id' },
    { tabla: 'facturas', columna: 'comprobante_id' },
  ],
};

// Reenlace best-effort al restaurar un archivo suelto (modulo 'documentos'): busca, entre los
// posibles expedientes del mismo propietario cuyo campo correspondiente este vacio, un unico
// candidato inequivoco y reconecta el archivo ahi. Si hay 0 o mas de 1 candidato no se adivina
// (podria pisar un archivo distinto que ya ocupa el campo), el archivo solo se revive sin enlazar.
async function reenlazarArchivoRestaurado(documentoId: number, actorId: number): Promise<void> {
  const [origenRows] = await pool.execute<DocumentoOrigenRow[]>(
    `SELECT d.propietario_id, td.clave AS tipo_clave
     FROM documentos d
     JOIN tipos_documento td ON td.id = d.tipo_documento_id
     WHERE d.id = ?`,
    [documentoId],
  );
  const origen = origenRows[0];
  if (!origen || origen.propietario_id === null) {
    return;
  }

  const candidatosSlot = SLOTS_POR_CLAVE[origen.tipo_clave];
  if (!candidatosSlot) {
    return;
  }

  const coincidencias: Array<{ tabla: string; columna: string; id: number }> = [];
  for (const { tabla, columna } of candidatosSlot) {
    const [rows] = await pool.execute<CandidatoSlotRow[]>(
      `SELECT id FROM ${tabla} WHERE propietario_id = ? AND ${columna} IS NULL`,
      [origen.propietario_id],
    );
    for (const row of rows) {
      coincidencias.push({ tabla, columna, id: row.id });
    }
  }

  const unico = coincidencias.length === 1 ? coincidencias[0] : undefined;
  if (!unico) {
    return;
  }

  const { tabla, columna, id: parentId } = unico;
  await pool.execute<ResultSetHeader>(
    `UPDATE ${tabla} SET ${columna} = ?, modificado_por = ? WHERE id = ? AND ${columna} IS NULL`,
    [documentoId, actorId, parentId],
  );
}

export async function restaurar(
  modulo: ModuloPapelera,
  id: number,
  actorId: number,
  soloUsuarioId?: number,
): Promise<void> {
  const tabla = TABLA_POR_MODULO[modulo];
  const params: Array<string | number> = [actorId, id];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND modificado_por = ?';
    params.push(soloUsuarioId);
  }
  await pool.execute<ResultSetHeader>(
    `UPDATE ${tabla} SET deleted_at = NULL, modificado_por = ? WHERE id = ? AND deleted_at IS NOT NULL ${filtro}`,
    params,
  );

  if (modulo === 'documentos') {
    // Reenlace best-effort: si el archivo era un requisito de empresa china, su fila en
    // empresa_china_requisitos conserva documento_id y se borro logicamente junto con el
    // archivo, asi que restaurarla reconecta automaticamente el requisito con su archivo.
    await pool.execute<ResultSetHeader>(
      `UPDATE empresa_china_requisitos SET deleted_at = NULL, modificado_por = ?
       WHERE documento_id = ? AND deleted_at IS NOT NULL`,
      [actorId, id],
    );

    await reenlazarArchivoRestaurado(id, actorId);
  }
}

async function findRutaStorage(id: number): Promise<string | null> {
  const [rows] = await pool.execute<RutaStorageRow[]>(
    `SELECT ruta_storage FROM documentos WHERE id = ? AND deleted_at IS NOT NULL`,
    [id],
  );
  return rows[0]?.ruta_storage ?? null;
}

export async function eliminarDefinitivo(
  modulo: ModuloPapelera,
  id: number,
  soloUsuarioId?: number,
): Promise<void> {
  const tabla = TABLA_POR_MODULO[modulo];
  const rutaStorage = modulo === 'documentos' ? await findRutaStorage(id) : null;

  const params: Array<string | number> = [id];
  let filtro = '';
  if (soloUsuarioId !== undefined) {
    filtro = 'AND modificado_por = ?';
    params.push(soloUsuarioId);
  }
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM ${tabla} WHERE id = ? AND deleted_at IS NOT NULL ${filtro}`,
    params,
  );

  if (rutaStorage && result.affectedRows > 0) {
    await eliminarArchivoFisico(rutaStorage);
  }
}

export async function vaciar(soloUsuarioId?: number, modulosPermitidos?: ModuloPapelera[]): Promise<void> {
  const permitidos = modulosPermitidos ? new Set(modulosPermitidos) : null;
  for (const [modulo, tabla] of Object.entries(TABLA_POR_MODULO)) {
    if (permitidos && !permitidos.has(modulo as ModuloPapelera)) {
      continue;
    }
    try {
      if (modulo === 'documentos') {
        const params: Array<string | number> = [];
        let filtro = '';
        if (soloUsuarioId !== undefined) {
          filtro = 'AND modificado_por = ?';
          params.push(soloUsuarioId);
        }
        const [rows] = await pool.execute<RutaStorageRow[]>(
          `SELECT ruta_storage FROM documentos WHERE deleted_at IS NOT NULL ${filtro}`,
          params,
        );
        await pool.execute(`DELETE FROM documentos WHERE deleted_at IS NOT NULL ${filtro}`, params);
        for (const row of rows) {
          await eliminarArchivoFisico(row.ruta_storage);
        }
      } else if (soloUsuarioId !== undefined) {
        await pool.execute(
          `DELETE FROM ${tabla} WHERE deleted_at IS NOT NULL AND modificado_por = ?`,
          [soloUsuarioId],
        );
      } else {
        await pool.execute(`DELETE FROM ${tabla} WHERE deleted_at IS NOT NULL`);
      }
    } catch (error) {
      console.error(`No fue posible vaciar la papelera de ${tabla}:`, error);
    }
  }
}

export async function purgarVencidos(): Promise<number> {
  let total = 0;
  for (const [modulo, tabla] of Object.entries(TABLA_POR_MODULO)) {
    try {
      if (modulo === 'documentos') {
        const [rows] = await pool.execute<RutaStorageRow[]>(
          `SELECT ruta_storage FROM documentos WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 30 DAY`,
        );
        const [result] = await pool.execute<ResultSetHeader>(
          `DELETE FROM documentos WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 30 DAY`,
        );
        for (const row of rows) {
          await eliminarArchivoFisico(row.ruta_storage);
        }
        total += result.affectedRows;
      } else {
        const [result] = await pool.execute<ResultSetHeader>(
          `DELETE FROM ${tabla} WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 30 DAY`,
        );
        total += result.affectedRows;
      }
    } catch (error) {
      console.error(`No fue posible purgar ${tabla}:`, error);
    }
  }
  return total;
}
