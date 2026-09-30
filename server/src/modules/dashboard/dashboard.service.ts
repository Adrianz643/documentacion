import * as repository from './dashboard.repository';
import type { DocumentoRecienteRawRow } from './dashboard.repository';
import type { DashboardResumenDTO, DocumentoRecienteDTO } from './dashboard.types';

function resolverModuloYRuta(row: DocumentoRecienteRawRow): { modulo: string; ruta: Array<string | number> | null } {
  if (row.dp_id !== null) {
    return { modulo: 'Documentos Personales', ruta: ['/empresas', row.empresa_id, 'documentos', 'personales', row.dp_id] };
  }
  if (row.dcl_id !== null) {
    return { modulo: 'Declaraciones', ruta: ['/empresas', row.empresa_id, 'documentos', 'declaraciones', row.dcl_id] };
  }
  if (row.f_id !== null) {
    return { modulo: 'Facturas', ruta: ['/empresas', row.empresa_id, 'documentos', 'facturas', row.f_id] };
  }
  if (row.fr_id !== null) {
    return { modulo: 'FIEL', ruta: ['/empresas', row.empresa_id, 'documentos', 'fiel', row.fr_id] };
  }
  if (row.ec_id !== null) {
    return { modulo: 'Empresas Chinas', ruta: ['/empresas-chinas', row.ec_id] };
  }
  return { modulo: 'Documentos', ruta: null };
}

function mapRow(row: DocumentoRecienteRawRow): DocumentoRecienteDTO {
  const { modulo, ruta } = resolverModuloYRuta(row);
  return {
    id: row.id,
    nombreArchivo: row.nombre_archivo,
    mimeType: row.mime_type,
    tamanoBytes: row.tamano_bytes,
    rutaStorage: row.ruta_storage,
    createdAt: row.created_at.toISOString(),
    subidoPorNombre: row.subido_por_nombre?.trim() || 'Sistema',
    subidoPorRol: row.subido_por_rol ?? 'N/D',
    modulo,
    ruta,
  };
}

export async function resumen(actor: { sub: number; rol: string }): Promise<DashboardResumenDTO> {
  const soloPropios = actor.rol.toLowerCase() === 'editor';
  const [documentosTotales, filas] = await Promise.all([
    repository.contarDocumentosTotales(),
    repository.findRecientes(soloPropios ? actor.sub : undefined),
  ]);
  return { documentosTotales, recientes: filas.map(mapRow) };
}
