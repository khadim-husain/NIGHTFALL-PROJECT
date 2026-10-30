import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { createOrderSchema, quoteSchema, orderQuerySchema } from './orders.schemas.js';

const router = Router();

// Pricing quote preview
router.post('/quote', validateRequest({ body: quoteSchema }), (req, res, next) =>
  ordersController.getQuote(req, res, next)
);

// Order listings (compatible with frontend getOrders)
router.get('/', optionalAuthenticate, validateRequest({ query: orderQuerySchema }), (req, res, next) =>
  ordersController.getAll(req, res, next)
);

// Single order details
router.get('/:id', optionalAuthenticate, (req, res, next) => ordersController.getById(req, res, next));

// Download official PDF receipt
router.get('/:id/receipt', optionalAuthenticate, (req, res, next) => ordersController.getReceipt(req, res, next));

// Create new order
router.post('/', authenticate, validateRequest({ body: createOrderSchema }), (req, res, next) =>
  ordersController.create(req, res, next)
);

// Request reprint
router.post('/:id/reprint', authenticate, (req, res, next) => ordersController.reprint(req, res, next));

// Cancel order
router.post('/:id/cancel', authenticate, (req, res, next) => ordersController.cancel(req, res, next));

export default router;

