import { jsPDF } from 'jspdf';

/** Relación de aspecto real de public/logo.jpeg (ancho x alto en px). */
const LOGO_RATIO = 248 / 180;

let logoBase64Cache: Promise<string> | null = null;

/** Carga el logo de la empresa (public/logo.jpeg) como data URL, cacheado tras la primera llamada. */
function cargarLogoReporte(): Promise<string> {
  if (!logoBase64Cache) {
    logoBase64Cache = fetch('/logo.jpeg')
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  }
  return logoBase64Cache;
}

/** Dibuja el logo de la empresa en la esquina superior derecha del documento, a un tamaño acorde al reporte. */
export async function agregarLogoReporte(doc: jsPDF, anchoMm = 30): Promise<void> {
  const logo = await cargarLogoReporte();
  const pageWidth = doc.internal.pageSize.getWidth();
  const altoMm = anchoMm / LOGO_RATIO;
  const margen = 14;
  doc.addImage(logo, 'JPEG', pageWidth - margen - anchoMm, 8, anchoMm, altoMm);
}

export interface SegmentoPastel {
  etiqueta: string;
  valor: number;
  color: [number, number, number];
}

/** Genera un gráfico de pastel como imagen PNG (data URL) a partir de los segmentos dados. */
export function generarGraficoPastel(segmentos: SegmentoPastel[], tamanoPx = 260): string {
  const canvas = document.createElement('canvas');
  canvas.width = tamanoPx;
  canvas.height = tamanoPx;
  const ctx = canvas.getContext('2d')!;
  const cx = tamanoPx / 2;
  const cy = tamanoPx / 2;
  const radio = tamanoPx / 2 - 4;
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);

  if (total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.fillStyle = '#E5E7EB';
    ctx.fill();
    return canvas.toDataURL('image/png');
  }

  let anguloInicio = -Math.PI / 2;
  for (const s of segmentos) {
    if (s.valor <= 0) continue;
    const anguloFin = anguloInicio + (s.valor / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radio, anguloInicio, anguloFin);
    ctx.closePath();
    ctx.fillStyle = `rgb(${s.color[0]},${s.color[1]},${s.color[2]})`;
    ctx.fill();
    anguloInicio = anguloFin;
  }

  return canvas.toDataURL('image/png');
}

/** Dibuja el gráfico de pastel y su leyenda (color, etiqueta, valor y %) en el documento. */
export function dibujarGraficoPastelConLeyenda(
  doc: jsPDF,
  segmentos: SegmentoPastel[],
  x: number,
  y: number,
  diametroMm = 42
): number {
  const grafico = generarGraficoPastel(segmentos);
  doc.addImage(grafico, 'PNG', x, y, diametroMm, diametroMm);

  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);
  const legendX = x + diametroMm + 8;
  let legendY = y + 6;
  doc.setFontSize(9);
  for (const s of segmentos) {
    const pct = total > 0 ? Math.round((s.valor / total) * 100) : 0;
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.setTextColor(60);
    doc.text(`${s.etiqueta}: ${s.valor} (${pct}%)`, legendX + 7, legendY);
    legendY += 7;
  }

  return y + diametroMm;
}
