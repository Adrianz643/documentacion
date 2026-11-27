// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { actualizarPreferenciaHandler, obtenerPreferenciaHandler } from './apariencia.controller';

const router = Router();

router.get('/me', requireAuth, obtenerPreferenciaHandler);
router.put('/me', requireAuth, actualizarPreferenciaHandler);

export default router;
