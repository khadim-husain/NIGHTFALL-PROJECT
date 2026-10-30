import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { PrintJobStatus } from '@prisma/client';

describe('Complete End-to-End Order-to-Print Workflow', () => {
  const app = createApp();
  let customerToken: string;
  let adminToken: string;
  let uploadedDocId: string;
  let createdOrderId: string;
  let claimedJobId: string;

  beforeAll(async () => {
    // Generate valid session tokens
    const custAuth = await authService.generateDemoToken('alex.rivera@designstudio.io');
    customerToken = custAuth.token;

    const admAuth = await authService.generateDemoToken('admin@nightfall.io');
    adminToken = admAuth.token;
  });

  afterAll(async () => {
    // Cleanup test artifacts from database and uploads
    if (createdOrderId) {
      await prisma.payment.deleteMany({ where: { orderId: createdOrderId } });
      await prisma.printJob.deleteMany({ where: { orderId: createdOrderId } });
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
    }
    if (uploadedDocId) {
      await prisma.document.deleteMany({ where: { id: uploadedDocId } });
    }
    await prisma.$disconnect();
  });

  it('Step 1: Authenticates customer and retrieves user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('alex.rivera@designstudio.io');
  });

  it('Step 2: Uploads a document with multipart file validation', async () => {
    const dummyPdfContent = Buffer.from('%PDF-1.4 Mock Document Content For E2E Workflow Test %%EOF');

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', dummyPdfContent, 'Project_Brief_E2E.pdf')
      .field('pageCount', '8');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.originalFilename).toBe('Project_Brief_E2E.pdf');
    expect(res.body.data.pageCount).toBe(8);

    uploadedDocId = res.body.data.id;
  });

  it('Step 3: Creates an order with authoritative server-side pricing', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        documentId: uploadedDocId,
        kioskId: 'K04',
        copies: 2,
        pageCount: 8,
        colorMode: 'Color',
        paperSize: 'A4',
        duplex: true,
        clientTotalAmount: 0.50, // Attempted price manipulation
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const order = res.body.data;
    createdOrderId = order.id;

    // 8 pages * 2 copies * $0.35 = $5.60 subtotal; 5.60 * 0.08 = $0.45 tax; total = $6.05
    expect(order.subtotal).toBe(5.6);
    expect(order.tax).toBe(0.45);
    expect(order.totalAmount).toBe(6.05);
    expect(order.status).toBe('Pending');
    expect(order.paymentStatus).toBe('Pending');
  });

  it('Step 4: Executes simulated payment with idempotency key and enqueues job', async () => {
    const idempotencyKey = `idemp_e2e_${Date.now()}`;

    const res = await request(app)
      .post('/api/v1/payments/simulate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: createdOrderId,
        idempotencyKey,
        cardLast4: '4242',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.status).toBe('Queued');
    expect(res.body.data.order.paymentStatus).toBe('Paid');
    expect(res.body.data.job.kioskId).toBe('K04');
    expect(res.body.data.job.status).toBe(PrintJobStatus.QUEUED);
  });

  it('Step 5: Kiosk K04 securely authenticates and claims its assigned job', async () => {
    const res = await request(app)
      .post('/api/v1/kiosks/K04/jobs/claim')
      .set('x-kiosk-id', 'K04')
      .set('x-kiosk-key', 'kiosk-secret-K04-2026');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(createdOrderId);
    expect(res.body.data.status).toBe(PrintJobStatus.CLAIMED);

    claimedJobId = res.body.data.id;
  });

  it('Step 6: Kiosk reports monotonic printing progress', async () => {
    // 25% progress
    const res25 = await request(app)
      .post(`/api/v1/kiosks/K04/jobs/${claimedJobId}/progress`)
      .set('x-kiosk-id', 'K04')
      .set('x-kiosk-key', 'kiosk-secret-K04-2026')
      .send({ progress: 25 });

    expect(res25.status).toBe(200);
    expect(res25.body.data.status).toBe(PrintJobStatus.PRINTING);
    expect(res25.body.data.progress).toBe(25);

    // 75% progress
    const res75 = await request(app)
      .post(`/api/v1/kiosks/K04/jobs/${claimedJobId}/progress`)
      .set('x-kiosk-id', 'K04')
      .set('x-kiosk-key', 'kiosk-secret-K04-2026')
      .send({ progress: 75 });

    expect(res75.status).toBe(200);
    expect(res75.body.data.progress).toBe(75);
  });

  it('Step 7: Kiosk completes the print job and marks order Completed', async () => {
    const res = await request(app)
      .post(`/api/v1/kiosks/K04/jobs/${claimedJobId}/complete`)
      .set('x-kiosk-id', 'K04')
      .set('x-kiosk-key', 'kiosk-secret-K04-2026')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(PrintJobStatus.COMPLETED);

    // Verify order in database is now Completed
    const order = await prisma.order.findUnique({ where: { id: createdOrderId } });
    expect(order?.status).toBe('Completed');
    expect(order?.progress).toBe(100);
  });

  it('Step 8: Verified immutable audit trail records the events', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
