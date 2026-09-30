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
