import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { requireSubrol } from '../../middlewares/subrol.middleware';
import { listarHandler } from './propietarios.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), requireSubrol('ARDUM'), listarHandler);

export default router;
