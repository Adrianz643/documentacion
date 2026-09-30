import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const UPLOADS_PUBLIC_PREFIX = '/uploads';

export interface ArchivoGuardado {
  nombreArchivo: string;
  rutaStorage: string;
  mimeType: string;
  tamanoBytes: number;
}

export async function guardarArchivo(
  subcarpeta: string,
  archivo: { originalname: string; mimetype: string; size: number; buffer: Buffer },
): Promise<ArchivoGuardado> {
  const extension = path.extname(archivo.originalname);
  const nombreDisco = `${randomUUID()}${extension}`;
  const carpetaDestino = path.join(UPLOADS_ROOT, subcarpeta);

  await fs.mkdir(carpetaDestino, { recursive: true });
  await fs.writeFile(path.join(carpetaDestino, nombreDisco), archivo.buffer);

  return {
    nombreArchivo: archivo.originalname,
    rutaStorage: `${UPLOADS_PUBLIC_PREFIX}/${subcarpeta}/${nombreDisco}`,
    mimeType: archivo.mimetype,
    tamanoBytes: archivo.size,
  };
}

export async function eliminarArchivoFisico(rutaStorage: string): Promise<void> {
  if (!rutaStorage.startsWith(UPLOADS_PUBLIC_PREFIX)) {
    return;
  }
  const rutaRelativa = rutaStorage.slice(UPLOADS_PUBLIC_PREFIX.length);
  try {
    await fs.unlink(path.join(UPLOADS_ROOT, rutaRelativa));
  } catch {
    // El archivo ya no existe en disco; no es un error para el flujo de negocio.
  }
}

export { UPLOADS_ROOT };
