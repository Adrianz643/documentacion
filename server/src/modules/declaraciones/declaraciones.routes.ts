import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { requireSubrol } from '../../middlewares/subrol.middleware';
import {
  actualizarHandler,
  crearHandler,
  detalleHandler,
  eliminarDocumentoHandler,
  eliminarHandler,
  listarHandler,
  subirDocumentoHandler,
  uploadMiddleware,
} from './declaraciones.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), requireSubrol('ARDUM'), listarHandler);
router.get('/:id', requireAuth, requirePermission('documentos.leer'), requireSubrol('ARDUM'), detalleHandler);
router.post('/', requireAuth, requirePermission('documentos.crear'), requireSubrol('ARDUM'), crearHandler);
router.put('/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('ARDUM'), actualizarHandler);
router.delete('/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('ARDUM'), eliminarHandler);
router.post(
  '/:id/documentos/:campo',
  requireAuth,
  requirePermission('documentos.crear'), requireSubrol('ARDUM'),
  uploadMiddleware,
  subirDocumentoHandler,
);
router.delete(
  '/:id/documentos/:campo',
  requireAuth,
  requirePermission('documentos.editar'), requireSubrol('ARDUM'),
  eliminarDocumentoHandler,
);

export default router;
