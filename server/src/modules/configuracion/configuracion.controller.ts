import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as configuracionService from './configuracion.service';

export const obtenerAlertaFielHandler = asyncHandler(async (_req: Request, res: Response) => {
  const configuracion = await configuracionService.obtenerAlertaFiel();
  res.status(200).json(configuracion);
});

export const actualizarAlertaFielHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }

  const { diasAnticipacion } = req.body as { diasAnticipacion?: unknown };
  const valor = Number(diasAnticipacion);
  if (Number.isNaN(valor)) {
    throw new HttpError(400, 'diasAnticipacion debe ser un número');
  }

  const configuracion = await configuracionService.actualizarAlertaFiel(valor, req.auth.sub);
  res.status(200).json(configuracion);
});
