import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: number;
  username: string;
  rol: string;
  permisos: string[];
  subroles: string[];
}

export function signAuthToken(payload: AuthTokenPayload): string {
  // jwtid asegura que dos logins del mismo usuario en el mismo segundo (iat identico)
  // no produzcan tokens identicos, lo que chocaria con la restriccion UNIQUE de sesiones.token.
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    jwtid: randomUUID(),
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as AuthTokenPayload;
}

export function decodeTokenExpiration(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error('El token generado no contiene fecha de expiracion');
  }
  return new Date(decoded.exp * 1000);
}
