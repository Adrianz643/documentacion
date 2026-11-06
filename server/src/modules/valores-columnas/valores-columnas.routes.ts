import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  guardarTextoHandler,
  listarHandler,
  quitarHandler,
  subirArchivoHandler,
  uploadMiddleware,
} from './valores-columnas.controller';

const router = Router();

router.get('/', requireAuth, requirePermission('documentos.leer'), listarHandler);
router.put('/:columnaId/:registroId', requireAuth, requirePermission('documentos.editar'), guardarTextoHandler);
router.post('/:columnaId/:registroId/archivo', requireAuth, requirePermission('documentos.crear'), uploadMiddleware, subirArchivoHandler);
router.delete('/:columnaId/:registroId', requireAuth, requirePermission('documentos.editar'), quitarHandler);

export default router;
