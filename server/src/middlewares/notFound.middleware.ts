import type { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ message: `Recurso no encontrado: ${req.method} ${req.originalUrl}` });
}
