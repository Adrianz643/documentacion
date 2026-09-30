import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { actualizarPreferenciaHandler, obtenerPreferenciaHandler } from './apariencia.controller';

const router = Router();

router.get('/me', requireAuth, obtenerPreferenciaHandler);
router.put('/me', requireAuth, actualizarPreferenciaHandler);

export default router;
