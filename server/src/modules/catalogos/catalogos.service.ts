import * as catalogosRepository from './catalogos.repository';
import type { CatalogosUsuariosDTO } from './catalogos.types';

export async function obtenerCatalogosUsuarios(): Promise<CatalogosUsuariosDTO> {
  const [paises, tiposDocumento, roles, estadosUsuario, subroles] = await Promise.all([
    catalogosRepository.findPaises(),
    catalogosRepository.findTiposDocumento(),
    catalogosRepository.findRoles(),
    catalogosRepository.findEstadosUsuario(),
    catalogosRepository.findSubroles(),
  ]);

  return {
    paises: paises.map((p) => ({ id: p.id, codigoIso: p.codigo_iso, nombre: p.nombre })),
    tiposDocumento: tiposDocumento.map((t) => ({ id: t.id, clave: t.clave, nombre: t.nombre })),
    roles: roles.map((r) => ({ id: r.id, nombre: r.nombre, descripcion: r.descripcion })),
    estadosUsuario: estadosUsuario.map((e) => ({ id: e.id, clave: e.clave, nombre: e.nombre })),
    subroles: subroles.map((s) => ({ id: s.id, clave: s.clave, nombre: s.nombre })),
  };
}
