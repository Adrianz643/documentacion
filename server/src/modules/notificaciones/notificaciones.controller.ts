import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './notificaciones.service';

function parseIdParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id invalido');
  }
  return id;
}

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const resultado = await service.listar(req.auth.sub);
  res.status(200).json(resultado);
});

export const marcarLeidaHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  await service.marcarLeida(id, req.auth.sub);
  res.status(204).send();
});

export const marcarTodasLeidasHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  await service.marcarTodasLeidas(req.auth.sub);
  res.status(204).send();
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  await service.eliminar(id, req.auth.sub);
  res.status(204).send();
});
