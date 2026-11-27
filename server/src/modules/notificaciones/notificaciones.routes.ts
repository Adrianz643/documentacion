// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  eliminarHandler,
  listarHandler,
  marcarLeidaHandler,
  marcarTodasLeidasHandler,
} from './notificaciones.controller';

const router = Router();

router.get('/', requireAuth, listarHandler);
router.patch('/:id/leer', requireAuth, marcarLeidaHandler);
router.post('/leer-todas', requireAuth, marcarTodasLeidasHandler);
router.delete('/:id', requireAuth, eliminarHandler);

export default router;
