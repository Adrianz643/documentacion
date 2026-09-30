import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as catalogosService from './catalogos.service';

export const obtenerCatalogosHandler = asyncHandler(async (_req: Request, res: Response) => {
  const catalogos = await catalogosService.obtenerCatalogosUsuarios();
  res.status(200).json(catalogos);
});
