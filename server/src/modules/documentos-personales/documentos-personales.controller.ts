import type { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as service from './documentos-personales.service';
import {
  parseActualizarDocumentoPersonalInput,
  parseCampoDocumentoPersonal,
  parseCrearDocumentoPersonalInput,
} from './documentos-personales.validation';

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

function parseEmpresaIdQuery(value: unknown): number {
  const empresaId = Number(value);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  return empresaId;
}

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = parseEmpresaIdQuery(req.query.empresaId);
  const registros = await service.listar(empresaId);
  res.status(200).json(registros);
});

export const detalleHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const empresaId = parseEmpresaIdQuery(req.query.empresaId);
  const registro = await service.obtenerDetalle(id, empresaId);
  res.status(200).json(registro);
});

export const crearHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const input = parseCrearDocumentoPersonalInput(req.body);
  const creado = await service.crear(input, req.auth.sub);
  res.status(201).json(creado);
});

export const actualizarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const empresaId = parseEmpresaIdQuery(req.body.empresaId);
  const input = parseActualizarDocumentoPersonalInput(req.body);
  const actualizado = await service.actualizar(id, empresaId, input, req.auth.sub);
  res.status(200).json(actualizado);
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const empresaId = parseEmpresaIdQuery(req.query.empresaId);
  await service.eliminar(id, empresaId, req.auth.sub);
  res.status(204).send();
});

export const subirDocumentoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const campo = parseCampoDocumentoPersonal(req.params.campo);
  const empresaId = parseEmpresaIdQuery(req.body.empresaId);
  if (!req.file) {
    throw new HttpError(400, 'El archivo es requerido');
  }
  const actualizado = await service.subirDocumento(id, empresaId, campo, req.file, req.auth.sub);
  res.status(200).json(actualizado);
});

export const eliminarDocumentoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const campo = parseCampoDocumentoPersonal(req.params.campo);
  const empresaId = parseEmpresaIdQuery(req.query.empresaId);
  const actualizado = await service.eliminarDocumento(id, empresaId, campo, req.auth.sub);
  res.status(200).json(actualizado);
});
