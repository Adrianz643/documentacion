// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as catalogosService from './catalogos.service';

export const obtenerCatalogosHandler = asyncHandler(async (_req: Request, res: Response) => {
  const catalogos = await catalogosService.obtenerCatalogosUsuarios();
  res.status(200).json(catalogos);
});
