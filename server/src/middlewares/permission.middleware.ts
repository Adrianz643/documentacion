// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

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
