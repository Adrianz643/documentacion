import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { crearHandler, listarHandler } from './columnas-personalizadas.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), listarHandler);
router.post('/', requireAuth, requirePermission('documentos.crear'), crearHandler);

export default router;
