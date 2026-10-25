import type JSZip from 'jszip';
import { Documento } from '../../core/models';

export class DocumentosZip {
  private readonly usados = new Set<string>();

  constructor(private readonly destino: Pick<JSZip, 'file'>) {}

  async agregar(doc: Documento): Promise<boolean> {
    try {
      const blob = await obtenerBlob(doc.rutaStorage);
      this.destino.file(this.nombreUnico(doc.nombreArchivo), blob);
      return true;
    } catch {
      return false;
    }
  }

  private nombreUnico(nombre: string): string {
    const punto = nombre.lastIndexOf('.');
    const base = punto > 0 ? nombre.slice(0, punto) : nombre;
    const extension = punto > 0 ? nombre.slice(punto) : '';
    let candidato = nombre;
    let contador = 1;
    while (this.usados.has(candidato.toLowerCase())) {
      contador++;
      candidato = `${base} (${contador})${extension}`;
    }
    this.usados.add(candidato.toLowerCase());
    return candidato;
  }
}

export async function obtenerBlob(ruta: string): Promise<Blob> {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.blob();
}

export function guardarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function descargarZip(zip: JSZip, nombre: string): Promise<void> {
  guardarBlob(await zip.generateAsync({ type: 'blob' }), nombre);
}

export async function descargarDocumento(doc: Documento): Promise<void> {
  guardarBlob(await obtenerBlob(doc.rutaStorage), doc.nombreArchivo);
}
