import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { kiosksService } from '../../src/modules/kiosks/kiosks.service.js';
import { PrintJobStatus } from '@prisma/client';

describe('Concurrent Job Claiming & State Machine Transitions', () => {
  let testOrderId: string;
  let testJobId: string;

  beforeAll(async () => {
    // Create an isolated order and queued print job assigned to K01
    testOrderId = `#NF-CONCUR-${Date.now()}`;
    const user = await prisma.user.findFirst();
    const doc = await prisma.document.findFirst();

    await prisma.order.create({
      data: {
        id: testOrderId,
        customerId: user!.id,
        documentId: doc!.id,
        kioskId: 'K01',
        copies: 1,
        pageCount: 5,
        subtotal: 1.75,
        tax: 0.14,
        totalAmount: 1.89,
        status: 'Queued',
        paymentStatus: 'Paid',
      },
    });

    const job = await prisma.printJob.create({
      data: {
        orderId: testOrderId,
        kioskId: 'K01',
        status: PrintJobStatus.QUEUED,
        progress: 0,
      },
    });

    testJobId = job.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('guarantees that between two concurrent claim requests, exactly one succeeds and one gets null', async () => {
    // Launch two parallel asynchronous claim requests for K01 at the exact same moment
    const [result1, result2] = await Promise.all([
      kiosksService.claimNextJob('K01'),
      kiosksService.claimNextJob('K01'),
    ]);

    const successClaims = [result1, result2].filter((r) => r !== null);
    const nullClaims = [result1, result2].filter((r) => r === null);

    // Exactly one must win the lease!
    expect(successClaims.length).toBe(1);
    expect(nullClaims.length).toBe(1);
    expect(successClaims[0]?.id).toBe(testJobId);
    expect(successClaims[0]?.status).toBe(PrintJobStatus.CLAIMED);
  });

  it('rejects progress report from the wrong kiosk', async () => {
    // Job is assigned to K01. K02 tries to report progress.
    await expect(
      kiosksService.reportJobProgress('K02', testJobId, { progress: 20 })
    ).rejects.toThrow('Authorization failed');
  });

  it('rejects stale or regressive progress updates', async () => {
    // Advance progress to 50%
    await kiosksService.reportJobProgress('K01', testJobId, { progress: 50 });

    // Regressive update of 30% must be rejected
    await expect(
      kiosksService.reportJobProgress('K01', testJobId, { progress: 30 })
    ).rejects.toThrow('Stale progress update ignored');
  });

  it('handles job completion idempotently without errors', async () => {
    // First completion
    const comp1 = await kiosksService.completeJob('K01', testJobId);
    expect(comp1.status).toBe(PrintJobStatus.COMPLETED);

    // Duplicate retry completion
    const comp2 = await kiosksService.completeJob('K01', testJobId);
    expect(comp2.status).toBe(PrintJobStatus.COMPLETED);
  });
});

