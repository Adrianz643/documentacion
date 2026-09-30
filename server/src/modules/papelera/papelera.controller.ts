import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './papelera.service';

function parseIdParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id invalido');
  }
  return id;
}

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const items = await service.listar(req.auth);
  res.status(200).json(items);
});

export const restaurarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const modulo = service.validarModulo(req.params.modulo);
  const id = parseIdParam(req.params.id);
  await service.restaurar(modulo, id, req.auth);
  res.status(204).send();
});

export const eliminarDefinitivoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const modulo = service.validarModulo(req.params.modulo);
  const id = parseIdParam(req.params.id);
  await service.eliminarDefinitivo(modulo, id, req.auth);
  res.status(204).send();
});

export const vaciarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  await service.vaciar(req.auth);
  res.status(204).send();
});
