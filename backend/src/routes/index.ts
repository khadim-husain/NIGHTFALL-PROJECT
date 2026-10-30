import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import zonesRouter from '../modules/zones/zones.routes.js';
import kiosksRouter from '../modules/kiosks/kiosks.routes.js';
import documentsRouter from '../modules/documents/documents.routes.js';
import ordersRouter from '../modules/orders/orders.routes.js';
import paymentsRouter from '../modules/payments/payments.routes.js';
import incidentsRouter from '../modules/incidents/incidents.routes.js';
import auditLogsRouter from '../modules/audit-logs/audit-logs.routes.js';
import { prisma } from '../config/prisma.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0',
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});

// Module routes
router.use('/auth', authRouter);
router.use('/zones', zonesRouter);
router.use('/kiosks', kiosksRouter);
router.use('/documents', documentsRouter);
router.use('/orders', ordersRouter);
router.use('/payments', paymentsRouter);
router.use('/incidents', incidentsRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;

