import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env';
import { UPLOADS_ROOT } from '../utils/fileStorage';

const BACKUPS_ROOT = env.backups.dir;
const INTERVALO_MS = 24 * 60 * 60 * 1000; // cada 24 horas
const MANIFEST_FILENAME = 'manifest.json';
const ESTADO_FILENAME = 'estado.json';

interface ManifestBackup {
  timestamp: string;
  exitoso: boolean;
  error?: string;
  duracionMs: number;
  baseDatos?: { archivo: string; bytes: number; sha256: string };
  uploads?: { archivos: number; bytes: number };
}

function timestampCarpeta(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function volcarBaseDatos(destino: string): Promise<{ archivo: string; bytes: number; sha256: string }> {
  const archivoSalida = path.join(destino, 'gdprod.sql');

  await new Promise<void>((resolve, reject) => {
    const proceso = spawn(
      env.backups.mysqldumpPath,
      [
        `--host=${env.db.host}`,
        `--port=${env.db.port}`,
        `--user=${env.db.user}`,
        '--single-transaction',
        '--routines',
        '--triggers',
        env.db.database,
      ],
      { env: { ...process.env, MYSQL_PWD: env.db.password } },
    );

    const salida = createWriteStream(archivoSalida);
    proceso.stdout.pipe(salida);

    let stderr = '';
    proceso.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proceso.on('error', reject);
    proceso.on('close', (codigo) => {
      if (codigo === 0) resolve();
      else reject(new Error(`mysqldump termino con codigo ${codigo}: ${stderr.trim()}`));
    });
  });

  const stats = await fs.stat(archivoSalida);
  if (stats.size === 0) {
    throw new Error('El volcado de la base de datos quedo vacio');
  }

  const buffer = await fs.readFile(archivoSalida);
  // La imagen runner (Alpine) solo tiene disponible el cliente mysqldump de
  // MariaDB (paquete apk mysql-client), cuyo encabezado dice "MariaDB dump"
  // en vez de "MySQL dump" aunque el volcado en si es un SQL estandar,
  // compatible con el servidor MySQL 8 real.
  const encabezado = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  if (!encabezado.includes('MySQL dump') && !encabezado.includes('MariaDB dump')) {
    throw new Error('El volcado de la base de datos no tiene el encabezado esperado (posible fallo silencioso de mysqldump)');
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return { archivo: archivoSalida, bytes: stats.size, sha256 };
}

async function contarArchivos(dir: string): Promise<{ archivos: number; bytes: number }> {
  let archivos = 0;
  let bytes = 0;

  async function recorrer(actual: string): Promise<void> {
    const entradas = await fs.readdir(actual, { withFileTypes: true });
    for (const entrada of entradas) {
      const rutaCompleta = path.join(actual, entrada.name);
      if (entrada.isDirectory()) {
        await recorrer(rutaCompleta);
      } else if (entrada.isFile()) {
        archivos += 1;
        const stats = await fs.stat(rutaCompleta);
        bytes += stats.size;
      }
    }
  }

  try {
    await recorrer(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  return { archivos, bytes };
}

async function copiarUploads(destino: string): Promise<{ archivos: number; bytes: number }> {
  const destinoUploads = path.join(destino, 'uploads');
  const origen = await contarArchivos(UPLOADS_ROOT);

  await fs.cp(UPLOADS_ROOT, destinoUploads, { recursive: true });

  const copia = await contarArchivos(destinoUploads);
  if (copia.archivos !== origen.archivos || copia.bytes !== origen.bytes) {
    throw new Error(
      `La copia de uploads no coincide con el original ` +
      `(origen: ${origen.archivos} archivos / ${origen.bytes} bytes, copia: ${copia.archivos} / ${copia.bytes} bytes)`,
    );
  }

  return copia;
}

async function purgarBackupsVencidos(): Promise<void> {
  const limite = Date.now() - env.backups.retencionDias * 24 * 60 * 60 * 1000;
  let carpetas: string[];
  try {
    carpetas = await fs.readdir(BACKUPS_ROOT);
  } catch {
    return;
  }

  for (const carpeta of carpetas) {
    if (carpeta === ESTADO_FILENAME) continue;
    const rutaCarpeta = path.join(BACKUPS_ROOT, carpeta);
    const stats = await fs.stat(rutaCarpeta).catch(() => null);
    if (stats?.isDirectory() && stats.mtimeMs < limite) {
      await fs.rm(rutaCarpeta, { recursive: true, force: true });
      console.log(`Backup: carpeta vencida eliminada (${carpeta})`);
    }
  }
}

async function actualizarEstadoGlobal(manifest: ManifestBackup): Promise<void> {
  await fs.mkdir(BACKUPS_ROOT, { recursive: true });
  await fs.writeFile(path.join(BACKUPS_ROOT, ESTADO_FILENAME), JSON.stringify(manifest, null, 2), 'utf8');
}

let ejecutando = false;

export async function ejecutarBackup(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;

  const inicio = Date.now();
  const carpetaBackup = path.join(BACKUPS_ROOT, timestampCarpeta());
  const manifest: ManifestBackup = { timestamp: new Date().toISOString(), exitoso: false, duracionMs: 0 };

  try {
    await fs.mkdir(carpetaBackup, { recursive: true });

    const infoDb = await volcarBaseDatos(carpetaBackup);
    manifest.baseDatos = infoDb;

    const infoUploads = await copiarUploads(carpetaBackup);
    manifest.uploads = infoUploads;

    manifest.exitoso = true;
    console.log(
      `Backup completado en ${carpetaBackup} ` +
      `(BD: ${(infoDb.bytes / 1024).toFixed(1)} KB, uploads: ${infoUploads.archivos} archivos / ${(infoUploads.bytes / 1024 / 1024).toFixed(2)} MB)`,
    );

    await purgarBackupsVencidos();
  } catch (error) {
    manifest.error = error instanceof Error ? error.message : String(error);
    console.error('Backup fallido:', manifest.error);
  } finally {
    manifest.duracionMs = Date.now() - inicio;
    try {
      await fs.writeFile(path.join(carpetaBackup, MANIFEST_FILENAME), JSON.stringify(manifest, null, 2), 'utf8');
    } catch {
      // si ni el manifest local se pudo escribir, el estado global sigue siendo la fuente de verdad
    }
    await actualizarEstadoGlobal(manifest).catch((e: unknown) => console.error('No fue posible actualizar el estado de backups:', e));
    ejecutando = false;
  }
}

async function yaTocaBackup(): Promise<boolean> {
  try {
    const estadoRaw = await fs.readFile(path.join(BACKUPS_ROOT, ESTADO_FILENAME), 'utf8');
    const estado = JSON.parse(estadoRaw) as ManifestBackup;
    const ultimaVez = new Date(estado.timestamp).getTime();
    return Date.now() - ultimaVez >= INTERVALO_MS;
  } catch {
    return true; // nunca se ha corrido un backup
  }
}

export function iniciarJobBackup(): void {
  void yaTocaBackup().then((toca) => {
    if (toca) void ejecutarBackup();
  });
  setInterval(() => { void ejecutarBackup(); }, INTERVALO_MS);
}
