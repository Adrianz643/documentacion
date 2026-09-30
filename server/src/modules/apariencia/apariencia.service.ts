import * as aparienciaRepository from './apariencia.repository';
import type { AparienciaDTO } from './apariencia.types';

export async function obtenerPreferencia(usuarioId: number): Promise<AparienciaDTO> {
  const modoOscuro = await aparienciaRepository.findModoOscuroByUsuarioId(usuarioId);
  return { modoOscuro };
}

export async function actualizarPreferencia(usuarioId: number, modoOscuro: boolean): Promise<AparienciaDTO> {
  await aparienciaRepository.upsertModoOscuro(usuarioId, modoOscuro, usuarioId);
  return { modoOscuro };
}
