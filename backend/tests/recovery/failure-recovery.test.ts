import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { kiosksService } from '../../src/modules/kiosks/kiosks.service.js';
import { incidentsService } from '../../src/modules/incidents/incidents.service.js';
import { PrintJobStatus, KioskStatus } from '@prisma/client';

describe('Failure Recovery & Uncertain Physical Outcome Safety', () => {
  let orderId: string;
  let jobId: string;

  beforeAll(async () => {
    orderId = `#NF-RECOV-${Date.now()}`;
    const user = await prisma.user.findFirst();
    const doc = await prisma.document.findFirst();

    await prisma.order.create({
      data: {
        id: orderId,
        customerId: user!.id,
        documentId: doc!.id,
        kioskId: 'K02',
        copies: 1,
        pageCount: 10,
        subtotal: 3.5,
        tax: 0.28,
        totalAmount: 3.78,
        status: 'Printing',
        paymentStatus: 'Paid',
      },
    });

    const job = await prisma.printJob.create({
      data: {
        orderId,
        kioskId: 'K02',
        status: PrintJobStatus.PRINTING,
        progress: 45,
      },
    });

    jobId = job.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('marks job status as UNCERTAIN instead of reprinting when physical outcome is ambiguous', async () => {
    // When paper feed or hardware halts mid-flight with ambiguous physical state
    const result = await kiosksService.failJob(
      'K02',
      jobId,
      'Power surge interrupted fuser unit. Physical sheets trapped in mechanism.',
      true // isUncertain = true
    );

    expect(result.status).toBe(PrintJobStatus.UNCERTAIN);

    // Kiosk is now in Error status
    const kiosk = await prisma.kiosk.findUnique({ where: { id: 'K02' } });
    expect(kiosk?.status).toBe(KioskStatus.Error);

    // An Incident has been automatically dispatched
    const incident = await prisma.incident.findFirst({
      where: { kioskId: 'K02', status: 'Open' },
    });
    expect(incident).toBeDefined();
    expect(incident?.severity).toBe('Error');

    // Operator resolves incident
    const resolved = await incidentsService.resolveIncident(incident!.id, 'technician@nightfall.io');
    expect(resolved.status).toBe('Resolved');

    // Kiosk is restored to Online!
    const restoredKiosk = await prisma.kiosk.findUnique({ where: { id: 'K02' } });
    expect(restoredKiosk?.status).toBe(KioskStatus.Online);
  });
});

