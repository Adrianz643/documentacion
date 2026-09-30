import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { actualizarAlertaFielHandler, obtenerAlertaFielHandler } from './configuracion.controller';

const router = Router();

router.get('/alertas-fiel', requireAuth, requirePermission('usuarios.editar'), obtenerAlertaFielHandler);
router.put('/alertas-fiel', requireAuth, requirePermission('usuarios.editar'), actualizarAlertaFielHandler);

export default router;
