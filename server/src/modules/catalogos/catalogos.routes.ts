import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { obtenerCatalogosHandler } from './catalogos.controller';

const router = Router();

router.get('/', requireAuth, obtenerCatalogosHandler);

export default router;
