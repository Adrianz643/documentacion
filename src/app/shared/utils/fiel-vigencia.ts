// Calendario de vigencia FIEL: a partir del 1 de enero de 2022, la FIEL tiene
// una vigencia de 4 años desde su fecha de creación.
export const VIGENCIA_FIEL_ANIOS = 4;
export const VIGENCIA_FIEL_DESDE = '2022-01-01';
export const VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS = 90;

export interface EstadoVigenciaFiel {
  clase: string;
  label: string;
}

export function calcularVencimientoFiel(fechaCreacion: string): string {
  if (!fechaCreacion) return '';
  const fecha = new Date(`${fechaCreacion}T00:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha < new Date(`${VIGENCIA_FIEL_DESDE}T00:00:00`)) return '';
  const vencimiento = new Date(fecha);
  vencimiento.setFullYear(vencimiento.getFullYear() + VIGENCIA_FIEL_ANIOS);
  return vencimiento.toISOString().slice(0, 10);
}

export function diasRestantesVigenciaFiel(fechaVencimiento: string | null | undefined): number | null {
  if (!fechaVencimiento) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(`${fechaVencimiento}T00:00:00`);
  if (Number.isNaN(vencimiento.getTime())) return null;
  return Math.round((vencimiento.getTime() - hoy.getTime()) / 86_400_000);
}

export function estadoVigenciaFiel(fechaVencimiento: string | null | undefined): EstadoVigenciaFiel {
  const dias = diasRestantesVigenciaFiel(fechaVencimiento);
  if (dias === null) return { clase: '', label: 'Sin fecha' };
  if (dias < 0) return { clase: 'gd-badge-vigencia--vencida', label: 'Vencida' };
  if (dias <= VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS) {
    return { clase: 'gd-badge-vigencia--por-vencer', label: `Por vencer (${dias} día${dias === 1 ? '' : 's'})` };
  }
  return { clase: 'gd-badge-vigencia--vigente', label: 'Vigente' };
}

function hoyISO(): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy.toISOString().slice(0, 10);
}

// El límite inferior avanza junto con "hoy": no tiene sentido registrar una FIEL
// nueva cuya vigencia de 4 años ya haya vencido (p. ej. en 2027 ya no debe dejarse
// elegir una fecha de creación anterior al 1/ene/2023, porque 2023 + 4 = 2027).
// Nunca baja del inicio de la regla (1/ene/2022), aunque "hoy" esté antes de esa fecha.
export function fechaCreacionMinimaFiel(hoy: Date = new Date()): string {
  const limite = new Date(hoy);
  limite.setHours(0, 0, 0, 0);
  limite.setFullYear(limite.getFullYear() - VIGENCIA_FIEL_ANIOS);
  const desde = new Date(`${VIGENCIA_FIEL_DESDE}T00:00:00`);
  return (limite > desde ? limite : desde).toISOString().slice(0, 10);
}

export function fechaCreacionMaximaFiel(): string {
  return hoyISO();
}

export function validarFechaCreacionFiel(valor: string | null | undefined, hoy: Date = new Date()): boolean {
  if (!valor) return true;
  const minima = fechaCreacionMinimaFiel(hoy);
  const maxima = fechaCreacionMaximaFiel();
  return valor >= minima && valor <= maxima;
}
