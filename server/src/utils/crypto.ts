import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const ALGORITMO_SECRETO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function claveSecreta(): Buffer {
  const clave = Buffer.from(env.security.fielContrasenaKey, 'hex');
  if (clave.length !== 32) {
    throw new Error('FIEL_CONTRASENA_KEY debe ser una cadena hexadecimal de 32 bytes (64 caracteres)');
  }
  return clave;
}

export function encryptSecret(texto: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO_SECRETO, claveSecreta(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, cifrado]).toString('base64');
}

export function decryptSecret(valor: string): string {
  const datos = Buffer.from(valor, 'base64');
  const iv = datos.subarray(0, IV_BYTES);
  const authTag = datos.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const cifrado = datos.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITMO_SECRETO, claveSecreta(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
}
