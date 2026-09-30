import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as usuariosService from './usuarios.service';
import {
  parseActualizarPerfilPropioInput,
  parseActualizarUsuarioInput,
  parseCrearUsuarioInput,
} from './usuarios.validation';

function parseIdParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id invalido');
  }
  return id;
}

export const obtenerPerfilHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }

  const perfil = await usuariosService.obtenerPerfilActual(req.auth.sub);
  res.status(200).json(perfil);
});

export const obtenerPerfilDetalleHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const detalle = await usuariosService.obtenerDetalle(req.auth.sub);
  res.status(200).json(detalle);
});

export const actualizarPerfilHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const input = parseActualizarPerfilPropioInput(req.body);
  const perfil = await usuariosService.actualizarPerfilPropio(req.auth.sub, input, req.auth.sub);
  res.status(200).json(perfil);
});

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await usuariosService.listar({
    page: req.query.page ? Number(req.query.page) : undefined,
    perPage: req.query.perPage ? Number(req.query.perPage) : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  });
  res.status(200).json(resultado);
});

export const detalleHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const detalle = await usuariosService.obtenerDetalle(id);
  res.status(200).json(detalle);
});

export const crearHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const input = parseCrearUsuarioInput(req.body);
  const creado = await usuariosService.crear(input, req.auth.sub, req.auth.rol);
  res.status(201).json(creado);
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const id = parseIdParam(req.params.id);
  await usuariosService.eliminar(id, req.auth.sub);
  res.status(204).send();
});

export const actualizarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new HttpError(401, 'No autenticado');
  }
  const id = parseIdParam(req.params.id);
  const input = parseActualizarUsuarioInput(req.body);
  const actualizado = await usuariosService.actualizar(id, input, req.auth.sub, req.auth.rol);
  res.status(200).json(actualizado);
});
