import { Router } from 'express';
import { incidentsController } from './incidents.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { requireOperatorOrAdmin } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createIncidentSchema, incidentQuerySchema } from './incidents.schemas.js';

const router = Router();

router.get('/', optionalAuthenticate, validateRequest({ query: incidentQuerySchema }), (req, res, next) =>
  incidentsController.getAll(req, res, next)
);

router.get('/:id', optionalAuthenticate, (req, res, next) => incidentsController.getById(req, res, next));

router.post(
  '/',
  authenticate,
  requireOperatorOrAdmin,
  validateRequest({ body: createIncidentSchema }),
  (req, res, next) => incidentsController.create(req, res, next)
);

router.post('/:id/resolve', authenticate, requireOperatorOrAdmin, (req, res, next) =>
  incidentsController.resolve(req, res, next)
);

export default router;

