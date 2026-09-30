import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './actividad.service';

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const items = await service.listar(req.auth);
  res.status(200).json(items);
});
