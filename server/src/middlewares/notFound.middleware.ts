// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import type { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ message: `Recurso no encontrado: ${req.method} ${req.originalUrl}` });
}
