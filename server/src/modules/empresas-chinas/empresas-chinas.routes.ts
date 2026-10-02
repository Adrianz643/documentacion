import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { requireSubrol } from '../../middlewares/subrol.middleware';
import {
  crearHandler,
  detalleHandler,
  eliminarHandler,
  eliminarRequisitoHandler,
  kpisHandler,
  listarEtapaHandler,
  listarRequisitosHandler,
  listarTodasHandler,
  subirRequisitoHandler,
  uploadMiddleware,
} from './empresas-chinas.controller';

const router = Router();

router.get('/etapa/:etapaNum/requisitos', requireAuth, requirePermission('documentos.leer'), requireSubrol('EMPRESAS_CHINAS'), listarRequisitosHandler);
router.get('/etapa/:etapaNum', requireAuth, requirePermission('documentos.leer'), requireSubrol('EMPRESAS_CHINAS'), listarEtapaHandler);
router.get('/todas', requireAuth, requirePermission('documentos.leer'), requireSubrol('EMPRESAS_CHINAS'), listarTodasHandler);
router.get('/kpis', requireAuth, requirePermission('documentos.leer'), requireSubrol('EMPRESAS_CHINAS'), kpisHandler);
router.post('/', requireAuth, requirePermission('documentos.crear'), requireSubrol('EMPRESAS_CHINAS'), crearHandler);
router.get('/:id', requireAuth, requirePermission('documentos.leer'), requireSubrol('EMPRESAS_CHINAS'), detalleHandler);
router.delete('/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('EMPRESAS_CHINAS'), eliminarHandler);
router.post(
  '/:id/requisitos/:codigo',
  requireAuth,
  requirePermission('documentos.crear'), requireSubrol('EMPRESAS_CHINAS'),
  uploadMiddleware,
  subirRequisitoHandler,
);
router.delete(
  '/:id/requisitos/:codigo',
  requireAuth,
  requirePermission('documentos.editar'), requireSubrol('EMPRESAS_CHINAS'),
  eliminarRequisitoHandler,
);

export default router;
