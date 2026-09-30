import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { listarHandler } from './actividad.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('actividad.leer'), listarHandler);

export default router;
