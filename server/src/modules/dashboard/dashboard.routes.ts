import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { resumenHandler } from './dashboard.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), resumenHandler);

export default router;
