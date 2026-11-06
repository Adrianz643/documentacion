import type { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import { verificarAccesoSubrol } from '../../middlewares/subrol.middleware';
import * as service from './valores-columnas.service';

const MAX_ARCHIVO_BYTES = 20 * 1024 * 1024;
const EMPRESA_ID_SUBROL: Record<number, string> = { 1: 'ARDUM', 2: 'EMPRESAS_CHINAS', 3: 'ARDUM_HL' };

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ARCHIVO_BYTES },
}).single('archivo');

function parseId(value: unknown, etiqueta: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${etiqueta} es invalido`);
  }
  return id;
}

async function verificarSubrolDeColumna(req: Request, columnaId: number): Promise<void> {
  const empresaId = await service.obtenerEmpresaIdDeColumna(columnaId);
  if (empresaId === null) {
    throw new HttpError(404, 'Columna no encontrada');
  }
  const subrol = EMPRESA_ID_SUBROL[empresaId];
  if (subrol) verificarAccesoSubrol(req.auth, subrol);
}

export const listarHandler = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = parseId(req.query.empresaId, 'empresaId');
  const seccion = typeof req.query.seccion === 'string' ? req.query.seccion.trim() : '';
  if (!seccion) throw new HttpError(400, 'seccion es requerida');
  const subrol = EMPRESA_ID_SUBROL[empresaId];
  if (subrol) verificarAccesoSubrol(req.auth, subrol);
  res.status(200).json(await service.listar(empresaId, seccion));
});

export const guardarTextoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const columnaId = parseId(req.params.columnaId, 'La columna');
  const registroId = parseId(req.params.registroId, 'El registro');
  await verificarSubrolDeColumna(req, columnaId);
  const valor = typeof req.body?.valorTexto === 'string' ? req.body.valorTexto : '';
  res.status(200).json(await service.guardarTexto(columnaId, registroId, valor, req.auth.sub));
});

export const subirArchivoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const columnaId = parseId(req.params.columnaId, 'La columna');
  const registroId = parseId(req.params.registroId, 'El registro');
  await verificarSubrolDeColumna(req, columnaId);
  if (!req.file) throw new HttpError(400, 'El archivo es requerido');
  res.status(200).json(await service.guardarDocumento(columnaId, registroId, req.file, req.auth.sub));
});

export const quitarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, 'No autenticado');
  const columnaId = parseId(req.params.columnaId, 'La columna');
  const registroId = parseId(req.params.registroId, 'El registro');
  await verificarSubrolDeColumna(req, columnaId);
  await service.quitar(columnaId, registroId, req.auth.sub);
  res.status(204).send();
});
