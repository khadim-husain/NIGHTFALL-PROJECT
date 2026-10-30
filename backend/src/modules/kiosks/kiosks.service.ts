import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { EventPublisher } from '../realtime/events.js';
import { storageService } from '../documents/storage.service.js';
import { KioskStatus, PrintJobStatus, OrderStatus, AttemptOutcome } from '@prisma/client';

export class KiosksService {
  /**
   * Helper to format a Kiosk row into frontend-compatible shape
   */
  private formatKiosk(k: any) {
    const timeDiffSeconds = Math.floor((Date.now() - new Date(k.lastSeen).getTime()) / 1000);
    let lastSeenText = 'Just now';
    if (timeDiffSeconds > 3600) {
      lastSeenText = `${Math.floor(timeDiffSeconds / 3600)} hrs ago`;
    } else if (timeDiffSeconds > 60) {
      lastSeenText = `${Math.floor(timeDiffSeconds / 60)} min ago`;
    }

    // Determine current job document & progress
    const activeJob = k.printJobs && k.printJobs[0];
    const currentJobDocument = activeJob?.order?.document?.originalFilename || undefined;
    const currentJobProgress = activeJob?.progress ?? (k.currentJobId ? 50 : 0);

    return {
      id: k.id,
      name: k.name,
      zone: k.zone?.name || 'Zone A',
      zoneLabel: k.zone?.label || 'Front Lobby',
      status: k.status,
      ipAddress: k.ipAddress,
      currentJobId: k.currentJobId || activeJob?.orderId || undefined,
      currentJobDocument,
      currentJobProgress,
      currentJobTimeRemaining: activeJob ? (activeJob.progress === 100 ? 'Completed' : `${Math.max(1, Math.ceil((100 - activeJob.progress) / 25))} min remaining`) : undefined,
      lastSeen: lastSeenText,
      queueLength: k.queueLength,
      totalPrints: k.totalPrints,
      temperature: Math.round(k.temperature),
      paperLevel: k.paperLevel,
      inkLevel: k.inkLevel,
      coordinates: {
        x: k.coordX,
        y: k.coordY,
        z: k.coordZ,
      },
      isRevoked: k.isRevoked,
    };
  }

  public async getAllKiosks() {
    const rawKiosks = await prisma.kiosk.findMany({
      include: {
        zone: true,
        printJobs: {
          where: { status: { in: [PrintJobStatus.CLAIMED, PrintJobStatus.PRINTING] } },
          include: { order: { include: { document: true } } },
          take: 1,
        },
      },
      orderBy: { id: 'asc' },
    });

    return rawKiosks.map((k) => this.formatKiosk(k));
  }

  public async getKioskById(id: string) {
    const kiosk = await prisma.kiosk.findUnique({
      where: { id: id.toUpperCase() },
      include: {
        zone: true,
        printJobs: {
          include: { order: { include: { document: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!kiosk) {
      throw new AppError(`Kiosk '${id}' not found.`, 404, 'KIOSK_NOT_FOUND');
    }

    return this.formatKiosk(kiosk);
  }

  public async recordHeartbeat(
    kioskId: string,
    data: { temperature?: number; paperLevel?: number; inkLevel?: number; status?: KioskStatus }
  ) {
    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new AppError('Kiosk not found', 404, 'KIOSK_NOT_FOUND');
    if (kiosk.isRevoked) throw new AppError('Kiosk credentials revoked', 403, 'KIOSK_REVOKED');

    const updated = await prisma.kiosk.update({
      where: { id: kioskId },
      data: {
        lastSeen: new Date(),
        ...(data.temperature !== undefined && { temperature: data.temperature }),
        ...(data.paperLevel !== undefined && { paperLevel: data.paperLevel }),
        ...(data.inkLevel !== undefined && { inkLevel: data.inkLevel }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    EventPublisher.publishKioskTelemetry(kioskId, {
      status: updated.status,
      temperature: updated.temperature,
      paperLevel: updated.paperLevel,
      inkLevel: updated.inkLevel,
    });

    return updated;
  }

  public async restartKiosk(kioskId: string, actor: string) {
    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new AppError('Kiosk not found', 404, 'KIOSK_NOT_FOUND');

    const updated = await prisma.kiosk.update({
      where: { id: kioskId },
      data: {
        status: KioskStatus.Online,
        lastSeen: new Date(),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor,
        actorRole: 'System Administrator',
        action: 'KIOSK_RESTART_REQUESTED',
        resource: `Kiosk ${kioskId}`,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        payload: { command: 'soft_restart', timestamp: new Date().toISOString() },
      },
    });

    EventPublisher.publishKioskTelemetry(kioskId, { status: KioskStatus.Online });
    return updated;
  }

  public async testPrint(kioskId: string, actor: string) {
    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new AppError('Kiosk not found', 404, 'KIOSK_NOT_FOUND');

    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor,
        actorRole: 'System Administrator',
        action: 'KIOSK_TEST_PRINT_DISPATCHED',
        resource: `Kiosk ${kioskId}`,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        payload: {
          testType: 'CMYK_CALIBRATION_PAGE',
          kioskId,
        },
      },
    });

    EventPublisher.publishKioskTelemetry(kioskId, {
      status: kiosk.status,
    });

    return {
      success: true,
      kioskId,
      dispatchedAt: new Date().toISOString(),
      testJobId: `CAL-${Math.floor(100 + Math.random() * 900)}`,
      message: `Test calibration page dispatched successfully to ${kioskId}.`,
    };
  }

  public async revokeKiosk(kioskId: string, actor: string) {
    const kiosk = await prisma.kiosk.update({
      where: { id: kioskId },
      data: {
        isRevoked: true,
        status: KioskStatus.Offline,
      },
    });

    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor,
        actorRole: 'System Administrator',
        action: 'KIOSK_SECURITY_REVOCATION',
        resource: `Kiosk ${kioskId}`,
        status: 'WARNING',
        ipAddress: '127.0.0.1',
        payload: { reason: 'Operator revocation requested', isRevoked: true },
      },
    });

    EventPublisher.publishKioskTelemetry(kioskId, { status: KioskStatus.Offline, isRevoked: true });
    return kiosk;
  }

  /**
   * ATOMIC JOB CLAIM:
   * Handles concurrent claim requests using a transaction and atomic conditional update.
   * If two kiosks request at the same time, exactly one succeeds.
   */
  public async claimNextJob(kioskId: string) {
    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new AppError('Kiosk not found', 404, 'KIOSK_NOT_FOUND');
    if (kiosk.isRevoked) throw new AppError('Kiosk credentials revoked', 403, 'KIOSK_REVOKED');

    const leaseDurationMinutes = 5;
    const leaseExpiration = new Date(Date.now() + leaseDurationMinutes * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      // Find candidate QUEUED job targeted for this kiosk (or unassigned in same zone)
      // Check for QUEUED or EXPIRED claim leases
      const candidateJob = await tx.printJob.findFirst({
        where: {
          kioskId,
          OR: [
            { status: PrintJobStatus.QUEUED },
            {
              status: PrintJobStatus.CLAIMED,
              claimLeaseExpiresAt: { lt: new Date() },
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!candidateJob) {
        return null;
      }

      // Execute atomic conditional update with optimistic version lock
      const updatedCount = await tx.printJob.updateMany({
        where: {
          id: candidateJob.id,
          version: candidateJob.version, // optimistic lock!
          OR: [
            { status: PrintJobStatus.QUEUED },
            {
              status: PrintJobStatus.CLAIMED,
              claimLeaseExpiresAt: { lt: new Date() },
            },
          ],
        },
        data: {
          status: PrintJobStatus.CLAIMED,
          claimLeaseExpiresAt: leaseExpiration,
          startedAt: new Date(),
          version: { increment: 1 },
          attemptCount: { increment: 1 },
        },
      });

      if (updatedCount.count === 0) {
        // Race condition: another concurrent claim request already claimed this job!
        return null;
      }

      // Record job attempt
      await tx.jobAttempt.create({
        data: {
          jobId: candidateJob.id,
          kioskId,
          attemptNumber: candidateJob.attemptCount + 1,
          outcome: AttemptOutcome.SUCCESS, // initially claimed
          startedAt: new Date(),
        },
      });

      // Update Order status to Printing
      await tx.order.update({
        where: { id: candidateJob.orderId },
        data: {
          status: OrderStatus.Printing,
          estimatedCompletion: '3 min remaining',
          timeline: [
            {
              title: 'Order Created',
              description: 'Received in system',
              time: 'Completed',
              completed: true,
            },
            {
              title: 'Payment & Authorization',
              description: 'Payment authorized & verified',
              time: 'Completed',
              completed: true,
            },
            {
              title: `Spooling to Kiosk ${kioskId}`,
              description: 'Dispatched to kiosk print hardware',
              time: 'Completed',
              completed: true,
            },
            {
              title: 'Printing in Progress',
              description: `Printing active on Kiosk ${kioskId}`,
              time: 'Active',
              completed: false,
            },
          ],
        },
      });

      // Update Kiosk currentJobId
      await tx.kiosk.update({
        where: { id: kioskId },
        data: { currentJobId: candidateJob.orderId },
      });

      const claimedJob = await tx.printJob.findUnique({
        where: { id: candidateJob.id },
        include: {
          order: {
            include: { document: true, customer: { select: { id: true, email: true, displayName: true } } },
          },
        },
      });

      if (claimedJob) {
        const downloadUrl = storageService.getSignedDownloadUrl(claimedJob.order.document.storageKey);
        EventPublisher.publishJobProgress({
          jobId: claimedJob.id,
          orderId: claimedJob.orderId,
          kioskId,
          customerId: claimedJob.order.customerId,
          progress: claimedJob.progress,
          status: 'CLAIMED',
          version: claimedJob.version,
        });

        return {
          ...claimedJob,
          downloadUrl,
        };
      }

      return null;
    });
  }

  /**
   * Kiosk reports progress on its claimed job
   */
  public async reportJobProgress(
    kioskId: string,
    jobId: string,
    payload: { progress: number; sequence?: number; temperature?: number; paperLevel?: number; inkLevel?: number }
  ) {
    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) throw new AppError('Print job not found', 404, 'JOB_NOT_FOUND');

    // Reject updates from the wrong kiosk!
    if (job.kioskId !== kioskId) {
      throw new AppError(`Authorization failed: Job is bound to kiosk ${job.kioskId}, not ${kioskId}.`, 403, 'WRONG_KIOSK');
    }

    // Reject updates on already finalized jobs
    if (job.status === PrintJobStatus.COMPLETED || job.status === PrintJobStatus.FAILED) {
      throw new AppError(`Cannot update progress: Job is already ${job.status}.`, 400, 'INVALID_STATE_TRANSITION');
    }

    // Sequence / monotonicity protection: progress cannot regress
    if (payload.progress < job.progress) {
      throw new AppError(`Stale progress update ignored: Current progress is ${job.progress}%, received ${payload.progress}%.`, 400, 'STALE_UPDATE');
    }

    const updatedJob = await prisma.printJob.update({
      where: { id: jobId },
      data: {
        progress: payload.progress,
        status: PrintJobStatus.PRINTING,
        version: { increment: 1 },
      },
    });

    // Update order progress as well
    await prisma.order.update({
      where: { id: job.orderId },
      data: {
        progress: payload.progress,
        status: OrderStatus.Printing,
      },
    });

    // Optional kiosk telemetry update
    if (payload.temperature || payload.paperLevel || payload.inkLevel) {
      await prisma.kiosk.update({
        where: { id: kioskId },
        data: {
          ...(payload.temperature && { temperature: payload.temperature }),
          ...(payload.paperLevel && { paperLevel: payload.paperLevel }),
          ...(payload.inkLevel && { inkLevel: payload.inkLevel }),
          lastSeen: new Date(),
        },
      });
    }

    EventPublisher.publishJobProgress({
      jobId: updatedJob.id,
      orderId: job.orderId,
      kioskId,
      customerId: job.order.customerId,
      progress: updatedJob.progress,
      status: 'PRINTING',
      version: updatedJob.version,
    });

    return updatedJob;
  }

  /**
   * Complete Job (Idempotent)
   */
  public async completeJob(kioskId: string, jobId: string) {
    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) throw new AppError('Print job not found', 404, 'JOB_NOT_FOUND');
    if (job.kioskId !== kioskId) {
      throw new AppError(`Cannot complete job: Bound to ${job.kioskId}, not ${kioskId}`, 403, 'WRONG_KIOSK');
    }

    // Idempotent check
    if (job.status === PrintJobStatus.COMPLETED) {
      return job;
    }

    return await prisma.$transaction(async (tx) => {
      const completed = await tx.printJob.update({
        where: { id: jobId },
        data: {
          status: PrintJobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: {
          status: OrderStatus.Completed,
          progress: 100,
          estimatedCompletion: 'Finished',
          timeline: [
            {
              title: 'Order Created',
              description: 'Received in system',
              time: 'Completed',
              completed: true,
            },
            {
              title: 'Payment & Authorization',
              description: 'Payment authorized & verified',
              time: 'Completed',
              completed: true,
            },
            {
              title: `Spooling to Kiosk ${kioskId}`,
              description: 'Dispatched to kiosk print hardware',
              time: 'Completed',
              completed: true,
            },
            {
              title: 'Printing Completed',
              description: 'All pages finished and ready at pickup bin',
              time: 'Finished',
              completed: true,
            },
          ],
        },
      });

      await tx.kiosk.update({
        where: { id: kioskId },
        data: {
          currentJobId: null,
          totalPrints: { increment: 1 },
          queueLength: { decrement: 1 },
          lastSeen: new Date(),
        },
      });

      // Update attempt
      await tx.jobAttempt.updateMany({
        where: { jobId, kioskId, finishedAt: null },
        data: {
          finishedAt: new Date(),
          outcome: AttemptOutcome.SUCCESS,
        },
      });

      EventPublisher.publishJobProgress({
        jobId: completed.id,
        orderId: job.orderId,
        kioskId,
        customerId: job.order.customerId,
        progress: 100,
        status: 'COMPLETED',
        version: completed.version,
      });

      return completed;
    });
  }

  /**
   * Fail / Mark Uncertain Job
   */
  public async failJob(kioskId: string, jobId: string, reason: string, isUncertain = false) {
    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) throw new AppError('Print job not found', 404, 'JOB_NOT_FOUND');
    if (job.kioskId !== kioskId) {
      throw new AppError('Kiosk mismatch', 403, 'WRONG_KIOSK');
    }

    const newStatus = isUncertain ? PrintJobStatus.UNCERTAIN : PrintJobStatus.FAILED;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.printJob.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          version: { increment: 1 },
        },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: {
          status: OrderStatus.Failed,
          estimatedCompletion: isUncertain ? 'Hardware status uncertain - awaiting technician' : 'Printing failed',
        },
      });

      // Update kiosk status to Error if hardware issue
      await tx.kiosk.update({
        where: { id: kioskId },
        data: {
          status: KioskStatus.Error,
          lastSeen: new Date(),
        },
      });

      // Record failure attempt
      await tx.jobAttempt.updateMany({
        where: { jobId, kioskId, finishedAt: null },
        data: {
          finishedAt: new Date(),
          outcome: AttemptOutcome.FAILURE,
          failureReason: reason,
        },
      });

      // Create an incident
      const incId = `INC-${Math.floor(400 + Math.random() * 500)}`;
      await tx.incident.create({
        data: {
          id: incId,
          kioskId,
          zone: 'Operations Hub',
          severity: 'Error',
          title: `Print failure on ${kioskId}`,
          description: reason,
          status: 'Open',
          reportedBy: `Automated Kiosk Agent (${kioskId})`,
        },
      });

      return res;
    });

    EventPublisher.publishJobProgress({
      jobId: updated.id,
      orderId: job.orderId,
      kioskId,
      customerId: job.order.customerId,
      progress: job.progress,
      status: newStatus,
      version: updated.version,
    });

    return updated;
  }
}

export const kiosksService = new KiosksService();

