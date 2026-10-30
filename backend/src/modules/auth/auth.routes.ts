import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { loginSchema, registerSchema, forgotPasswordSchema, demoTokenSchema } from './auth.schemas.js';
import { authenticate } from '../../middleware/auth.js';
import { sensitiveAuthLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/login',
  sensitiveAuthLimiter,
  validateRequest({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/register',
  sensitiveAuthLimiter,
  validateRequest({ body: registerSchema }),
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  '/forgot-password',
  sensitiveAuthLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

router.post(
  '/demo-token',
  validateRequest({ body: demoTokenSchema }),
  (req, res, next) => authController.demoToken(req, res, next)
);

export default router;
