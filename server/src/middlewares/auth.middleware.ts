import type { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.get('authorization');

  if (!header?.startsWith(BEARER_PREFIX)) {
    next(new HttpError(401, 'Token de autenticacion requerido'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Token invalido o expirado'));
  }
}
