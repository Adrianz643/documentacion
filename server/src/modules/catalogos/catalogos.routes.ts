// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { obtenerCatalogosHandler } from './catalogos.controller';

const router = Router();

router.get('/', requireAuth, obtenerCatalogosHandler);

export default router;
