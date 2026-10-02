import { HttpError } from '../../utils/httpError';
import { guardarArchivo } from '../../utils/fileStorage';
import { insertarDocumentoGenerico } from '../../utils/documentos';
import type {
  EmpresaChinaChecklistRow,
  EmpresaChinaRequisitoValorRow,
  EmpresaChinaRow,
  EtapaRequisitoRow,
} from '../../types/db.types';
import * as actividadService from '../actividad/actividad.service';
import * as repository from './empresas-chinas.repository';
import type {
  ArchivoSubidoInput,
  CrearEmpresaChinaInput,
  DocumentoDTO,
  EmpresaChinaDTO,
  EmpresaChinaDetalleDTO,
  EmpresaChinaRequisitoDTO,
  EtapaDetalleDTO,
  EtapaRequisitoDTO,
  FilaEtapaDTO,
  KpiEmpresasChinasDTO,
} from './empresas-chinas.types';

const EMPRESA_ID_CHINAS = 2;

const NOMBRES_ETAPA: Record<number, string> = {
  1: 'Aprobación del nombre de la empresa y estatutos',
  2: 'Registro Fiscal RFC',
  3: 'Firma Electrónica',
  4: 'Apertura de cuenta bancaria corporativa',
  5: 'Otros',
};

function mapEmpresa(row: EmpresaChinaRow): EmpresaChinaDTO {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    representanteLegal: row.representante_legal,
    correoElectronico: row.correo_electronico,
    telefono: row.telefono,
    fechaRegistro: row.fecha_registro ? row.fecha_registro.toISOString().slice(0, 10) : null,
    etapaActual: row.etapa_actual,
    estado: row.estado,
    progresoPct: row.progreso_pct,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapRequisito(row: EtapaRequisitoRow): EtapaRequisitoDTO {
  return { id: row.id, etapaNum: row.etapa_num, codigo: row.codigo, descripcion: row.descripcion, tipoCampo: row.tipo_campo };
}

function mapDocumento(row: EmpresaChinaRequisitoValorRow): DocumentoDTO | null {
  if (!row.documento_id || !row.doc_tipo_id || !row.doc_nombre || !row.doc_ruta || !row.doc_mime || row.doc_tam === null || !row.doc_subido_por || !row.doc_creado) {
    return null;
  }
  return {
    id: row.documento_id,
    empresaId: EMPRESA_ID_CHINAS,
    propietarioId: null,
    tipoDocumentoId: row.doc_tipo_id,
    nombreArchivo: row.doc_nombre,
    rutaStorage: row.doc_ruta,
    mimeType: row.doc_mime,
    tamanoByes: row.doc_tam,
    subidoPor: row.doc_subido_por,
    createdAt: row.doc_creado.toISOString(),
  };
}

function mapValor(row: EmpresaChinaRequisitoValorRow): EmpresaChinaRequisitoDTO {
  return {
    id: row.id,
    empresaChinaId: row.empresa_china_id,
    requisitoId: row.requisito_id,
    documentoId: row.documento_id,
    documento: mapDocumento(row),
    valorTexto: row.valor_texto,
    completado: row.completado === 1,
  };
}

export async function listarRequisitosPorEtapa(etapaNum: number): Promise<EtapaRequisitoDTO[]> {
  const rows = await repository.findRequisitosPorEtapa(etapaNum);
  return rows.map(mapRequisito);
}

export async function listarEtapa(etapaNum: number): Promise<FilaEtapaDTO[]> {
  const [empresas, valores, checklist] = await Promise.all([
    repository.findEmpresasActivas(),
    repository.findValoresPorEtapa(etapaNum),
    repository.findChecklistPorEtapa(etapaNum),
  ]);

  const valoresPorEmpresa = new Map<number, Record<string, EmpresaChinaRequisitoDTO>>();
  for (const row of valores) {
    if (!valoresPorEmpresa.has(row.empresa_china_id)) {
      valoresPorEmpresa.set(row.empresa_china_id, {});
    }
    valoresPorEmpresa.get(row.empresa_china_id)![row.requisito_codigo] = mapValor(row);
  }

  const checklistPorEmpresa = new Map<number, boolean>();
  for (const row of checklist) {
    checklistPorEmpresa.set(row.empresa_china_id, row.completada === 1);
  }

  return empresas.map((empresa) => ({
    ...mapEmpresa(empresa),
    requisitos: valoresPorEmpresa.get(empresa.id) ?? {},
    checkList: checklistPorEmpresa.get(empresa.id) ?? false,
  }));
}

export async function obtenerDetalle(id: number): Promise<EmpresaChinaDetalleDTO> {
  const empresa = await repository.findEmpresaById(id);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }

  const [requisitos, valores, checklist] = await Promise.all([
    repository.findTodosRequisitos(),
    repository.findValoresPorEmpresa(id),
    repository.findChecklistPorEmpresa(id),
  ]);

  const valoresPorCodigo = new Map<string, EmpresaChinaRequisitoDTO>();
  for (const row of valores) {
    valoresPorCodigo.set(row.requisito_codigo, mapValor(row));
  }
  const checklistPorEtapa = new Map<number, boolean>();
  for (const row of checklist) {
    checklistPorEtapa.set(row.etapa_num, row.completada === 1);
  }

  const etapas: EtapaDetalleDTO[] = [1, 2, 3, 4, 5].map((etapaNum) => {
    const requisitosEtapa = requisitos.filter((r) => r.etapa_num === etapaNum);
    return {
      etapaNum,
      requisitosEstado: requisitosEtapa.map((req) => ({
        req: mapRequisito(req),
        valor: valoresPorCodigo.get(req.codigo),
      })),
      checkList: checklistPorEtapa.get(etapaNum) ?? false,
    };
  }).filter((etapa) => etapa.requisitosEstado.length > 0);

  return { ...mapEmpresa(empresa), etapas };
}

export async function listarTodas(): Promise<EmpresaChinaDTO[]> {
  const empresas = await repository.findEmpresasActivas();
  return empresas.map(mapEmpresa);
}

export async function obtenerKpis(): Promise<KpiEmpresasChinasDTO> {
  const filas = await repository.countPorEtapaYEstado();

  let total = 0;
  let enProceso = 0;
  let pendientes = 0;
  let finalizadas = 0;

  const porEtapa = new Map<number, { empresas: number; completadas: number; enProceso: number; pendientes: number }>();
  for (let etapa = 1; etapa <= 5; etapa++) {
    porEtapa.set(etapa, { empresas: 0, completadas: 0, enProceso: 0, pendientes: 0 });
  }

  for (const fila of filas) {
    const cantidad = Number(fila.total);
    total += cantidad;

    if (fila.estado === 'en_proceso') enProceso += cantidad;
    else if (fila.estado === 'pendiente') pendientes += cantidad;
    else if (fila.estado === 'finalizada' || fila.estado === 'archivada') finalizadas += cantidad;

    const bucket = porEtapa.get(fila.etapa_actual);
    if (bucket) {
      bucket.empresas += cantidad;
      if (fila.estado === 'finalizada' || fila.estado === 'archivada') bucket.completadas += cantidad;
      else if (fila.estado === 'en_proceso') bucket.enProceso += cantidad;
      else if (fila.estado === 'pendiente') bucket.pendientes += cantidad;
    }
  }

  const progresoPorEtapa = Array.from(porEtapa.entries()).map(([etapa, datos]) => ({
    etapa,
    nombre: NOMBRES_ETAPA[etapa] ?? `Etapa ${etapa}`,
    ...datos,
  }));

  return { total, enProceso, pendientes, finalizadas, progresoPorEtapa };
}

export async function crear(input: CrearEmpresaChinaInput, actorId: number): Promise<EmpresaChinaDTO> {
  const id = await repository.crear(input, actorId);
  const empresa = await repository.findEmpresaById(id);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'EMPRESAS_CHINAS',
    accion: 'crear',
    descripcion: `Agregó la empresa "${input.nombre}"`,
    referenciaTabla: 'empresas_chinas',
    referenciaId: id,
  });
  return mapEmpresa(empresa!);
}

export async function eliminar(id: number, actorId: number): Promise<void> {
  const empresa = await repository.findEmpresaById(id);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  await repository.eliminar(id, actorId);
  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'EMPRESAS_CHINAS',
    accion: 'eliminar',
    descripcion: `Eliminó la empresa "${empresa.nombre}"`,
    referenciaTabla: 'empresas_chinas',
    referenciaId: id,
  });
}

export async function subirRequisito(
  empresaChinaId: number,
  requisitoCodigo: string,
  archivo: ArchivoSubidoInput | null,
  valorTexto: string | null,
  actorId: number,
): Promise<void> {
  const empresa = await repository.findEmpresaById(empresaChinaId);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  const requisito = await repository.findRequisitoPorCodigo(requisitoCodigo);
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }

  if (requisito.tipo_campo === 'archivo') {
    if (!archivo) {
      throw new HttpError(400, 'El archivo es requerido para este requisito');
    }
    const tipoDocumentoId = await repository.findTipoDocumentoRequisito();
    if (!tipoDocumentoId) {
      throw new HttpError(500, 'El tipo de documento no esta configurado');
    }

    const guardado = await guardarArchivo('empresas-chinas', archivo);
    const documentoId = await insertarDocumentoGenerico({
      empresaId: EMPRESA_ID_CHINAS,
      propietarioId: null,
      tipoDocumentoId,
      nombreArchivo: guardado.nombreArchivo,
      rutaStorage: guardado.rutaStorage,
      mimeType: guardado.mimeType,
      tamanoBytes: guardado.tamanoBytes,
      subidoPor: actorId,
    });
    // El requisito reemplazado solo se marca como borrado logico (repository.upsertValorArchivo
    // ya le puso deleted_at al documento anterior); el archivo fisico se conserva hasta que se
    // purgue desde Papelera, asi "Restaurar" siempre tiene bytes reales que recuperar.
    await repository.upsertValorArchivo(empresaChinaId, requisito.id, documentoId, actorId);
  } else {
    if (!valorTexto || !valorTexto.trim()) {
      throw new HttpError(400, 'El valor es requerido para este requisito');
    }
    await repository.upsertValorTexto(empresaChinaId, requisito.id, valorTexto.trim(), actorId);
  }

  await repository.recalcularProgreso(empresaChinaId, actorId);
  await repository.recalcularChecklist(empresaChinaId, requisito.etapa_num, actorId);

  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'EMPRESAS_CHINAS',
    accion: requisito.tipo_campo === 'archivo' ? 'subir' : 'editar',
    descripcion: `Actualizó el requisito "${requisito.descripcion}" de "${empresa.nombre}"`,
    referenciaTabla: 'empresas_chinas',
    referenciaId: empresaChinaId,
  });
}

export async function eliminarRequisito(
  empresaChinaId: number,
  requisitoCodigo: string,
  actorId: number,
): Promise<void> {
  const empresa = await repository.findEmpresaById(empresaChinaId);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  const requisito = await repository.findRequisitoPorCodigo(requisitoCodigo);
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }

  // Igual que arriba: solo se marca deleted_at, el archivo fisico se conserva hasta que se
  // purgue desde Papelera.
  await repository.eliminarValor(empresaChinaId, requisito.id, actorId);
  await repository.recalcularProgreso(empresaChinaId, actorId);
  await repository.recalcularChecklist(empresaChinaId, requisito.etapa_num, actorId);

  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'EMPRESAS_CHINAS',
    accion: 'eliminar',
    descripcion: `Eliminó el requisito "${requisito.descripcion}" de "${empresa.nombre}"`,
    referenciaTabla: 'empresas_chinas',
    referenciaId: empresaChinaId,
  });
}
