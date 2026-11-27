// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import * as papeleraRepository from '../modules/papelera/papelera.repository';

const INTERVALO_REVISION_MS = 60 * 60 * 1000;

let ejecutando = false;

export async function purgarPapeleraVencida(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const eliminados = await papeleraRepository.purgarVencidos();
    if (eliminados > 0) {
      console.log(`Papelera: ${eliminados} registro(s) con mas de 30 dias purgados definitivamente.`);
    }
  } catch (error) {
    console.error('Error al purgar la papelera vencida:', error);
  } finally {
    ejecutando = false;
  }
}

export function iniciarJobPurgaPapelera(): void {
  void purgarPapeleraVencida();
  setInterval(() => { void purgarPapeleraVencida(); }, INTERVALO_REVISION_MS);
}
