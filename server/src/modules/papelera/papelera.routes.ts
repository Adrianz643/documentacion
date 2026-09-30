import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  eliminarDefinitivoHandler,
  listarHandler,
  restaurarHandler,
  vaciarHandler,
} from './papelera.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), listarHandler);
router.delete('/', requireAuth, requirePermission('documentos.editar'), vaciarHandler);
router.put('/:modulo/:id/restaurar', requireAuth, requirePermission('documentos.editar'), restaurarHandler);
router.delete('/:modulo/:id', requireAuth, requirePermission('documentos.editar'), eliminarDefinitivoHandler);

export default router;
