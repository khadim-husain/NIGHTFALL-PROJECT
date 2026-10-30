import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { simulatePaymentSchema } from './payments.schemas.js';

const router = Router();

router.post(
  '/simulate',
  authenticate,
  validateRequest({ body: simulatePaymentSchema }),
  (req, res, next) => paymentsController.simulatePayment(req, res, next)
);

export default router;

