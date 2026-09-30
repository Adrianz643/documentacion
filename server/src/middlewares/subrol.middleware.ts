import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import type { AuthTokenPayload } from '../utils/jwt';

const ROLES_SIN_RESTRICCION = new Set(['admin', 'superadmin']);

export function verificarAccesoSubrol(auth: AuthTokenPayload | undefined, clave: string): void {
  if (!auth) {
    throw new HttpError(401, 'No autenticado');
  }
  if (ROLES_SIN_RESTRICCION.has(auth.rol.toLowerCase())) {
    return;
  }
  if (!auth.subroles?.includes(clave)) {
    throw new HttpError(403, 'No tiene acceso a este modulo');
  }
}

export function requireSubrol(clave: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      verificarAccesoSubrol(req.auth, clave);
      next();
    } catch (error) {
      next(error);
    }
  };
}
