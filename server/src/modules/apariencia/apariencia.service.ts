// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
