import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { auditLogQuerySchema } from './audit-logs.schemas.js';

const router = Router();

router.get('/', optionalAuthenticate, validateRequest({ query: auditLogQuerySchema }), (req, res, next) =>
  auditLogsController.getAll(req, res, next)
);

export default router;

