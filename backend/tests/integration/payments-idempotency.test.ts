import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Orders, Server-Side Pricing, & Payment Idempotency Integration', () => {
  const app = createApp();
  let customerToken: string;
  let testDocId: string;

  beforeAll(async () => {
    const custAuth = await authService.generateDemoToken('alex.rivera@designstudio.io');
    customerToken = custAuth.token;

    // Fetch existing test document for Alex
    const doc = await prisma.document.findFirst({
      where: { owner: { email: 'alex.rivera@designstudio.io' } },
    });
    testDocId = doc!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates order with server-calculated price and ignores any client-tampered price', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        documentId: testDocId,
        kioskId: 'K05',
        copies: 2,
        pageCount: 10,
        colorMode: 'Color',
        paperSize: 'A4',
        duplex: true,
        clientTotalAmount: 0.01, // Malicious tampered price!
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const order = res.body.data;
    // Server calculated: 10 * 2 * 0.35 = 7.00 subtotal, 7.00 * 0.08 = 0.56 tax, total = 7.56
    expect(order.totalAmount).toBe(7.56);
    expect(order.status).toBe('Pending');
    expect(order.paymentStatus).toBe('Pending');
  });

  it('processes payment and releases job to queue with strict idempotency', async () => {
    // 1. Create a new pending order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        documentId: testDocId,
        kioskId: 'K06',
        copies: 1,
        pageCount: 5,
        colorMode: 'Monochrome',
        paperSize: 'A4',
      });

    const orderId = orderRes.body.data.id;
    const idempotencyKey = `idemp_test_${Date.now()}_alpha`;

    // 2. First payment attempt
    const payRes1 = await request(app)
      .post('/api/v1/payments/simulate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId,
        idempotencyKey,
        cardLast4: '4242',
      });

    expect(payRes1.status).toBe(201);
    expect(payRes1.body.data.idempotentReplay).toBe(false);
    expect(payRes1.body.data.job.status).toBe('QUEUED');

    // 3. Duplicate payment attempt with SAME idempotency key (network retry / user double click)
    const payRes2 = await request(app)
      .post('/api/v1/payments/simulate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId,
        idempotencyKey,
        cardLast4: '4242',
      });

    expect(payRes2.status).toBe(200);
    expect(payRes2.body.data.idempotentReplay).toBe(true);
    expect(payRes2.body.data.payment.id).toBe(payRes1.body.data.payment.id);

    // 4. Verify in DB that only exactly ONE PrintJob exists for this order!
    const jobCount = await prisma.printJob.count({
      where: { orderId },
    });
    expect(jobCount).toBe(1);
  });
});

