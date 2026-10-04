import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware';
import { forgotPasswordHandler, loginHandler, logoutHandler, resetPasswordHandler } from './auth.controller';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' },
});

// Mas estricto que el login: ambos disparan envio de correo o cambian la contrasena.
const recuperacionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intente mas tarde.' },
});

const router = Router();

router.post('/login', loginLimiter, loginHandler);
router.post('/forgot-password', recuperacionLimiter, forgotPasswordHandler);
router.post('/reset-password', recuperacionLimiter, resetPasswordHandler);
router.post('/logout', requireAuth, logoutHandler);

export default router;
