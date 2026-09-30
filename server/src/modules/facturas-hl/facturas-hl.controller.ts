import type { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './facturas-hl.service';
import {
  parseActualizarFacturaHlInput,
  parseCampoFacturaHl,
  parseCrearFacturaHlInput,
} from './facturas-hl.validation';

const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024;
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ARCHIVO_BYTES },
}).single('archivo');

function parseIdParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id invalido');
  }
  return id;
}

export const listarHandler = asyncHandler(async (_req: Request, res: Response) => {
  const registros = await service.listar();
  res.status(200).json(registros);
});

export const detalleHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const registro = await service.obtenerDetalle(id);
  res.status(200).json(registro);
});

export const crearHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const input = parseCrearFacturaHlInput(req.body);
  const creado = await service.crear(input, req.auth.sub);
  res.status(201).json(creado);
});

export const actualizarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const input = parseActualizarFacturaHlInput(req.body);
  const actualizado = await service.actualizar(id, input, req.auth.sub);
  res.status(200).json(actualizado);
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  await service.eliminar(id, req.auth.sub);
  res.status(204).send();
});

export const subirDocumentoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const campo = parseCampoFacturaHl(req.params.campo);
  if (!req.file) {
    throw new HttpError(400, 'El archivo es requerido');
  }
  const actualizado = await service.subirDocumento(id, campo, req.file, req.auth.sub);
  res.status(200).json(actualizado);
});

export const eliminarDocumentoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const campo = parseCampoFacturaHl(req.params.campo);
  const actualizado = await service.eliminarDocumento(id, campo, req.auth.sub);
  res.status(200).json(actualizado);
});
