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
} from './facturas-hl.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), requireSubrol('ARDUM_HL'), listarHandler);
router.get('/:id', requireAuth, requirePermission('documentos.leer'), requireSubrol('ARDUM_HL'), detalleHandler);
router.post('/', requireAuth, requirePermission('documentos.crear'), requireSubrol('ARDUM_HL'), crearHandler);
router.put('/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('ARDUM_HL'), actualizarHandler);
router.delete('/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('ARDUM_HL'), eliminarHandler);
router.post(
  '/:id/documentos/:campo',
  requireAuth,
  requirePermission('documentos.crear'), requireSubrol('ARDUM_HL'),
  uploadMiddleware,
  subirDocumentoHandler,
);
router.delete(
  '/:id/documentos/:campo',
  requireAuth,
  requirePermission('documentos.editar'), requireSubrol('ARDUM_HL'),
  eliminarDocumentoHandler,
);

export default router;
