// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  actualizarHandler,
  actualizarPerfilHandler,
  crearHandler,
  detalleHandler,
  eliminarHandler,
  listarHandler,
  obtenerPerfilDetalleHandler,
  obtenerPerfilHandler,
} from './usuarios.controller';

const router = Router();

router.get('/me', requireAuth, obtenerPerfilHandler);
router.get('/me/detalle', requireAuth, obtenerPerfilDetalleHandler);
router.put('/me', requireAuth, actualizarPerfilHandler);
router.get('/', requireAuth, requirePermission('usuarios.leer'), listarHandler);
router.get('/:id', requireAuth, requirePermission('usuarios.leer'), detalleHandler);
router.post('/', requireAuth, requirePermission('usuarios.crear'), crearHandler);
router.put('/:id', requireAuth, requirePermission('usuarios.editar'), actualizarHandler);
router.delete('/:id', requireAuth, requirePermission('usuarios.editar'), eliminarHandler);

export default router;
