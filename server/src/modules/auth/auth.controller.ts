import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/httpError';
import * as actividadService from '../actividad/actividad.service';
import * as authService from './auth.service';

const BEARER_PREFIX = 'Bearer ';

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: unknown; password?: unknown };

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'username y password son requeridos');
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? 'desconocida';
  const userAgent = req.get('user-agent') ?? 'desconocido';

  const resultado = await authService.login({ username: username.trim(), password, ip, userAgent });

  void actividadService.registrar({
    usuarioId: resultado.usuario.id,
    modulo: 'AUTH',
    accion: 'login',
    descripcion: `Inició sesión como "${resultado.usuario.username}"`,
    ip,
  });

  res.status(200).json(resultado);
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : null;

  if (token) {
    await authService.logout(token);
  }

  if (req.auth) {
    void actividadService.registrar({
      usuarioId: req.auth.sub,
      modulo: 'AUTH',
      accion: 'logout',
      descripcion: `Cerró sesión como "${req.auth.username}"`,
    });
  }

  res.status(204).send();
});
