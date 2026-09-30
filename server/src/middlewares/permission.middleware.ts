import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

export function requirePermission(permiso: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth?.permisos.includes(permiso)) {
      next(new HttpError(403, 'No tiene permiso para realizar esta accion'));
      return;
    }
    next();
  };
}
