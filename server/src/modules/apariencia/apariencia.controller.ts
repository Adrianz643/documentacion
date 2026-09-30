import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as aparienciaService from './apariencia.service';

export const obtenerPreferenciaHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const preferencia = await aparienciaService.obtenerPreferencia(req.auth.sub);
  res.status(200).json(preferencia);
});

export const actualizarPreferenciaHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }

  const { modoOscuro } = req.body as { modoOscuro?: unknown };
  if (typeof modoOscuro !== 'boolean') {
    throw new HttpError(400, 'modoOscuro debe ser true o false');
  }

  const preferencia = await aparienciaService.actualizarPreferencia(req.auth.sub, modoOscuro);
  res.status(200).json(preferencia);
});
