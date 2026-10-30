import { Router } from 'express';
import { kiosksController } from './kiosks.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin, requireOperatorOrAdmin } from '../../middleware/rbac.js';
import { authenticateKiosk } from '../../middleware/kioskAuth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  kioskHeartbeatSchema,
  kioskProgressSchema,
  kioskCompleteSchema,
  kioskFailSchema,
} from './kiosks.schemas.js';

const router = Router();

// Public / Authenticated read operations
router.get('/', (req, res, next) => kiosksController.getAll(req, res, next));
router.get('/:id', (req, res, next) => kiosksController.getById(req, res, next));

// Administrative control routes
router.post('/:id/restart', authenticate, requireOperatorOrAdmin, (req, res, next) =>
  kiosksController.restart(req, res, next)
);

router.post('/:id/test-print', authenticate, requireOperatorOrAdmin, (req, res, next) =>
  kiosksController.testPrint(req, res, next)
);

router.post('/:id/revoke', authenticate, requireAdmin, (req, res, next) =>
  kiosksController.revoke(req, res, next)
);

// Kiosk Hardware Worker API (Secured with kiosk credentials)
router.post(
  '/:kioskId/heartbeat',
  authenticateKiosk,
  validateRequest({ body: kioskHeartbeatSchema }),
  (req, res, next) => kiosksController.heartbeat(req, res, next)
);

router.post('/:kioskId/jobs/claim', authenticateKiosk, (req, res, next) =>
  kiosksController.claimJob(req, res, next)
);

router.post(
  '/:kioskId/jobs/:jobId/progress',
  authenticateKiosk,
  validateRequest({ body: kioskProgressSchema }),
  (req, res, next) => kiosksController.reportProgress(req, res, next)
);

router.post(
  '/:kioskId/jobs/:jobId/complete',
  authenticateKiosk,
  validateRequest({ body: kioskCompleteSchema }),
  (req, res, next) => kiosksController.completeJob(req, res, next)
);

router.post(
  '/:kioskId/jobs/:jobId/fail',
  authenticateKiosk,
  validateRequest({ body: kioskFailSchema }),
  (req, res, next) => kiosksController.failJob(req, res, next)
);

export default router;

