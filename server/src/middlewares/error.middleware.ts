import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import { env } from '../config/env';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  console.error(err);
  const message = env.isProduction
    ? 'Error interno del servidor'
    : err instanceof Error
      ? err.message
      : 'Error interno del servidor';

  res.status(500).json({ message });
}
