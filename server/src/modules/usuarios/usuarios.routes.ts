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

// '/me...' debe registrarse antes de '/:id' para que Express no lo confunda con un id.
// Autoservicio: cualquier usuario autenticado puede ver/editar su propio perfil, sin el
// permiso 'usuarios.leer'/'usuarios.editar' que solo tienen admin/superadmin.
router.get('/me', requireAuth, obtenerPerfilHandler);
router.get('/me/detalle', requireAuth, obtenerPerfilDetalleHandler);
router.put('/me', requireAuth, actualizarPerfilHandler);
router.get('/', requireAuth, requirePermission('usuarios.leer'), listarHandler);
router.get('/:id', requireAuth, requirePermission('usuarios.leer'), detalleHandler);
router.post('/', requireAuth, requirePermission('usuarios.crear'), crearHandler);
router.put('/:id', requireAuth, requirePermission('usuarios.editar'), actualizarHandler);
router.delete('/:id', requireAuth, requirePermission('usuarios.editar'), eliminarHandler);

export default router;
