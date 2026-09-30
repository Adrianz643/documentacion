import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './propietarios.service';

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = Number(req.query.empresaId);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  const propietarios = await service.listarPorEmpresa(empresaId);
  res.status(200).json(propietarios);
});
