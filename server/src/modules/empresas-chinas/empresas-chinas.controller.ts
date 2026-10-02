import type { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './empresas-chinas.service';
import {
  parseCodigoParam,
  parseCrearEmpresaChinaInput,
  parseEtapaNumParam,
  parseIdParam,
} from './empresas-chinas.validation';

const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024;
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ARCHIVO_BYTES },
}).single('archivo');

export const listarRequisitosHandler = asyncHandler(async (req: Request, res: Response) => {
  const etapaNum = parseEtapaNumParam(req.params.etapaNum);
  const requisitos = await service.listarRequisitosPorEtapa(etapaNum);
  res.status(200).json(requisitos);
});

export const listarEtapaHandler = asyncHandler(async (req: Request, res: Response) => {
  const etapaNum = parseEtapaNumParam(req.params.etapaNum);
  const filas = await service.listarEtapa(etapaNum);
  res.status(200).json(filas);
});

export const listarTodasHandler = asyncHandler(async (_req: Request, res: Response) => {
  const empresas = await service.listarTodas();
  res.status(200).json(empresas);
});

export const kpisHandler = asyncHandler(async (_req: Request, res: Response) => {
  const kpis = await service.obtenerKpis();
  res.status(200).json(kpis);
});

export const detalleHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const detalle = await service.obtenerDetalle(id);
  res.status(200).json(detalle);
});

export const crearHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const input = parseCrearEmpresaChinaInput(req.body);
  const creado = await service.crear(input, req.auth.sub);
  res.status(201).json(creado);
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  await service.eliminar(id, req.auth.sub);
  res.status(204).send();
});

export const subirRequisitoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const codigo = parseCodigoParam(req.params.codigo);
  const valorTexto = typeof req.body?.valorTexto === 'string' ? req.body.valorTexto : null;
  await service.subirRequisito(id, codigo, req.file ?? null, valorTexto, req.auth.sub);
  res.status(200).json(await service.obtenerDetalle(id));
});

export const eliminarRequisitoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const codigo = parseCodigoParam(req.params.codigo);
  await service.eliminarRequisito(id, codigo, req.auth.sub);
  res.status(200).json(await service.obtenerDetalle(id));
});
