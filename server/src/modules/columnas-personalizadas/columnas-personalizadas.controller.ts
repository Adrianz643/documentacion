import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import { verificarAccesoSubrol } from '../../middlewares/subrol.middleware';
import * as service from './columnas-personalizadas.service';
import { parseCrearColumnaInput, parseEmpresaIdQuery, parseIdParam, parseSeccionQuery } from './columnas-personalizadas.validation';

// Modulo compartido por ARDUM (empresa_id=1) y Empresas Chinas (empresa_id=2): la clave de
// subrol requerida depende del empresaId recibido, no es fija como en el resto de modulos.
const EMPRESA_ID_SUBROL: Record<number, string> = { 1: 'ARDUM', 2: 'EMPRESAS_CHINAS' };

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = parseEmpresaIdQuery(req.query.empresaId);
  const seccion = parseSeccionQuery(req.query.seccion);
  const subrol = EMPRESA_ID_SUBROL[empresaId];
  if (subrol) verificarAccesoSubrol(req.auth, subrol);
  const columnas = await service.listar(empresaId, seccion);
  res.status(200).json(columnas);
});

export const crearHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const input = parseCrearColumnaInput(req.body);
  const subrol = EMPRESA_ID_SUBROL[input.empresaId];
  if (subrol) verificarAccesoSubrol(req.auth, subrol);
  const columnas = await service.crear(input, req.auth.sub);
  res.status(201).json(columnas);
});

export const eliminarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const id = parseIdParam(req.params.id);
  const empresaId = await service.obtenerEmpresaId(id);
  if (empresaId !== null) {
    const subrol = EMPRESA_ID_SUBROL[empresaId];
    if (subrol) verificarAccesoSubrol(req.auth, subrol);
  }
  const columnas = await service.eliminar(id, req.auth.sub);
  res.status(200).json(columnas);
});
