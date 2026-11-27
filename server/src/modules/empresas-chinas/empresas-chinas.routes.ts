// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { requireSubrol } from '../../middlewares/subrol.middleware';
import {
  crearHandler,
  crearRequisitoPersonalizadoHandler,
  detalleHandler,
  eliminarHandler,
  eliminarRequisitoPersonalizadoHandler,
  actualizarRequisitoHandler,
  eliminarDocumentoRequisitoHandler,
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
router.post('/etapa/:etapaNum/requisitos', requireAuth, requirePermission('documentos.crear'), requireSubrol('EMPRESAS_CHINAS'), crearRequisitoPersonalizadoHandler);
router.patch('/requisitos/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('EMPRESAS_CHINAS'), actualizarRequisitoHandler);
router.delete('/requisitos/:id', requireAuth, requirePermission('documentos.editar'), requireSubrol('EMPRESAS_CHINAS'), eliminarRequisitoPersonalizadoHandler);
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
router.delete(
  '/:id/requisitos/:codigo/documentos/:documentoId',
  requireAuth,
  requirePermission('documentos.editar'), requireSubrol('EMPRESAS_CHINAS'),
  eliminarDocumentoRequisitoHandler,
);

export default router;
