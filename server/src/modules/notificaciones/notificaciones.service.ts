import type { NotificacionRow } from '../../types/db.types';
import * as repository from './notificaciones.repository';
import type { NotificacionDTO, NotificacionesListadoDTO } from './notificaciones.types';

function mapRowToDTO(row: NotificacionRow): NotificacionDTO {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    cuerpo: row.cuerpo,
    ruta: row.ruta,
    leida: row.leida === 1,
    diasRestantes: row.dias_restantes,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listar(usuarioId: number): Promise<NotificacionesListadoDTO> {
  const [rows, noLeidas] = await Promise.all([
    repository.findByUsuario(usuarioId),
    repository.contarNoLeidas(usuarioId),
  ]);
  return { data: rows.map(mapRowToDTO), noLeidas };
}

export async function marcarLeida(id: number, usuarioId: number): Promise<void> {
  await repository.marcarLeida(id, usuarioId);
}

export async function marcarTodasLeidas(usuarioId: number): Promise<void> {
  await repository.marcarTodasLeidas(usuarioId);
}

export async function eliminar(id: number, usuarioId: number): Promise<void> {
  await repository.eliminar(id, usuarioId);
}
