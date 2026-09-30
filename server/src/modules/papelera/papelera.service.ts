import { HttpError } from '../../utils/httpError';
import * as actividadService from '../actividad/actividad.service';
import * as repository from './papelera.repository';
import type { PapeleraRawRow } from './papelera.repository';
import type { ModuloPapelera, PapeleraItemDTO } from './papelera.types';

export interface PapeleraActor {
  sub: number;
  rol: string;
  subroles: string[];
}

const ROLES_ADMIN = new Set(['admin', 'superadmin']);

function esAdmin(rol: string): boolean {
  return ROLES_ADMIN.has(rol.toLowerCase());
}

// Modulos cuya papelera pertenece a un subrol especifico; los que no aparecen aqui
// (usuarios, documentos sueltos) no se restringen por subrol.
const MODULO_SUBROL: Partial<Record<ModuloPapelera, string>> = {
  'documentos-personales': 'ARDUM',
  fiel: 'ARDUM',
  declaraciones: 'ARDUM',
  facturas: 'ARDUM',
  'facturas-hl': 'ARDUM_HL',
  'empresas-chinas': 'EMPRESAS_CHINAS',
};

function tieneAccesoModulo(actor: PapeleraActor, modulo: ModuloPapelera): boolean {
  if (esAdmin(actor.rol)) return true;
  const subrol = MODULO_SUBROL[modulo];
  return !subrol || actor.subroles.includes(subrol);
}

const MODULO_LABEL: Record<ModuloPapelera, string> = {
  'documentos-personales': 'Documentos Personales',
  fiel: 'FIEL',
  declaraciones: 'Declaraciones',
  facturas: 'Facturas',
  'facturas-hl': 'Facturas HL',
  'empresas-chinas': 'Empresas Chinas',
  usuarios: 'Usuarios',
  documentos: 'Archivos',
};

const MODULO_TIPO: Record<ModuloPapelera, string> = {
  'documentos-personales': 'Documento Personal',
  fiel: 'FIEL',
  declaraciones: 'Declaración',
  facturas: 'Factura',
  'facturas-hl': 'Factura HL',
  'empresas-chinas': 'Empresa',
  usuarios: 'Usuario',
  documentos: 'Archivo',
};

const DIAS_RETENCION = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function mapRow(modulo: ModuloPapelera, row: PapeleraRawRow): PapeleraItemDTO {
  const diasTranscurridos = Math.floor((Date.now() - row.deleted_at.getTime()) / MS_POR_DIA);
  const diasRestantes = Math.max(0, DIAS_RETENCION - diasTranscurridos);
  return {
    id: row.id,
    modulo,
    moduloLabel: MODULO_LABEL[modulo],
    tipo: MODULO_TIPO[modulo],
    nombre: row.nombre,
    eliminadoPor: row.eliminado_por?.trim() || 'Sistema',
    fechaEliminacion: row.deleted_at.toISOString(),
    diasRestantes,
  };
}

export async function listar(actor: PapeleraActor): Promise<PapeleraItemDTO[]> {
  const soloUsuarioId = esAdmin(actor.rol) ? undefined : actor.sub;

  const [docPersonales, fiel, declaraciones, facturas, facturasHl, empresasChinas, usuarios, documentos] = await Promise.all([
    repository.findDocumentosPersonalesEliminados(soloUsuarioId),
    repository.findFielEliminados(soloUsuarioId),
    repository.findDeclaracionesEliminadas(soloUsuarioId),
    repository.findFacturasEliminadas(soloUsuarioId),
    repository.findFacturasHlEliminadas(soloUsuarioId),
    repository.findEmpresasChinasEliminadas(soloUsuarioId),
    repository.findUsuariosEliminados(soloUsuarioId),
    repository.findDocumentosEliminados(soloUsuarioId),
  ]);

  const items = [
    ...docPersonales.map((r) => mapRow('documentos-personales', r)),
    ...fiel.map((r) => mapRow('fiel', r)),
    ...declaraciones.map((r) => mapRow('declaraciones', r)),
    ...facturas.map((r) => mapRow('facturas', r)),
    ...facturasHl.map((r) => mapRow('facturas-hl', r)),
    ...empresasChinas.map((r) => mapRow('empresas-chinas', r)),
    ...usuarios.map((r) => mapRow('usuarios', r)),
    ...documentos.map((r) => mapRow('documentos', r)),
  ];

  const visibles = items.filter((item) => tieneAccesoModulo(actor, item.modulo));
  visibles.sort((a, b) => b.fechaEliminacion.localeCompare(a.fechaEliminacion));
  return visibles;
}

export function validarModulo(modulo: string | undefined): ModuloPapelera {
  if (!modulo || !repository.esModuloValido(modulo)) {
    throw new HttpError(400, 'Modulo invalido');
  }
  return modulo;
}

export async function restaurar(modulo: ModuloPapelera, id: number, actor: PapeleraActor): Promise<void> {
  if (!tieneAccesoModulo(actor, modulo)) {
    throw new HttpError(403, 'No tiene acceso a este modulo');
  }
  const soloUsuarioId = esAdmin(actor.rol) ? undefined : actor.sub;
  await repository.restaurar(modulo, id, actor.sub, soloUsuarioId);

  void actividadService.registrar({
    usuarioId: actor.sub,
    modulo: 'PAPELERA',
    accion: 'restaurar',
    descripcion: `Restauró un registro de ${MODULO_LABEL[modulo]} (id ${id})`,
    referenciaTabla: modulo,
    referenciaId: id,
  });
}

export async function eliminarDefinitivo(modulo: ModuloPapelera, id: number, actor: PapeleraActor): Promise<void> {
  if (!tieneAccesoModulo(actor, modulo)) {
    throw new HttpError(403, 'No tiene acceso a este modulo');
  }
  const soloUsuarioId = esAdmin(actor.rol) ? undefined : actor.sub;
  try {
    await repository.eliminarDefinitivo(modulo, id, soloUsuarioId);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      throw new HttpError(409, 'No es posible eliminarlo de forma definitiva: tiene informacion relacionada.');
    }
    throw error;
  }

  void actividadService.registrar({
    usuarioId: actor.sub,
    modulo: 'PAPELERA',
    accion: 'eliminar',
    descripcion: `Eliminó definitivamente un registro de ${MODULO_LABEL[modulo]} (id ${id})`,
    referenciaTabla: modulo,
    referenciaId: id,
  });
}

export async function vaciar(actor: PapeleraActor): Promise<void> {
  const soloUsuarioId = esAdmin(actor.rol) ? undefined : actor.sub;
  const modulosPermitidos = esAdmin(actor.rol)
    ? undefined
    : (Object.keys(MODULO_LABEL) as ModuloPapelera[]).filter((modulo) => tieneAccesoModulo(actor, modulo));
  await repository.vaciar(soloUsuarioId, modulosPermitidos);

  void actividadService.registrar({
    usuarioId: actor.sub,
    modulo: 'PAPELERA',
    accion: 'eliminar',
    descripcion: 'Vació la papelera (borrado definitivo masivo)',
  });
}
