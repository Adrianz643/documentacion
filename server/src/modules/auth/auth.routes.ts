import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware';
import { loginHandler, logoutHandler } from './auth.controller';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' },
});

const router = Router();

router.post('/login', loginLimiter, loginHandler);
router.post('/logout', requireAuth, logoutHandler);

export default router;
