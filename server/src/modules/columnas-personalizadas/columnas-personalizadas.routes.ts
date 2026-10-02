import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { crearHandler, eliminarHandler, listarHandler } from './columnas-personalizadas.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), listarHandler);
router.post('/', requireAuth, requirePermission('documentos.crear'), crearHandler);
router.delete('/:id', requireAuth, requirePermission('documentos.editar'), eliminarHandler);

export default router;
