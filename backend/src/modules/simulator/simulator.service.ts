import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { kiosksService } from '../kiosks/kiosks.service.js';
import { PrintJobStatus, KioskStatus } from '@prisma/client';

export class SimulatorService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Print Queue & Kiosk Hardware Simulator started (tick: %dms)', env.SIMULATOR_TICK_INTERVAL_MS);

    this.timer = setInterval(async () => {
      try {
        await this.tick();
      } catch (err: any) {
        logger.error({ err: err.message }, 'Simulator tick error');
      }
    }, env.SIMULATOR_TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info('Print Queue Simulator stopped.');
  }

  /**
   * One simulation tick: claim queued jobs, advance printing progress, advance telemetry
   */
  public async tick() {
    // 1. Identify all active kiosks that can accept and process print jobs
    const eligibleKiosks = await prisma.kiosk.findMany({
      where: {
        isRevoked: false,
        status: { in: [KioskStatus.Online, KioskStatus.Idle, KioskStatus.Busy] },
      },
      select: { id: true, status: true },
    });

    // 2. Have eligible kiosks claim any QUEUED jobs waiting in the queue
    for (const kiosk of eligibleKiosks) {
      try {
        const claimed = await kiosksService.claimNextJob(kiosk.id);
        if (claimed) {
          logger.info({ kioskId: kiosk.id, jobId: claimed.id }, 'Simulator: Kiosk claimed queued job');
        }
      } catch (claimErr: any) {
        logger.debug({ kioskId: kiosk.id, error: claimErr.message }, 'Simulator claim check');
      }
    }

    // 3. Find jobs currently PRINTING or CLAIMED
    const activeJobs = await prisma.printJob.findMany({
      where: {
        status: { in: [PrintJobStatus.PRINTING, PrintJobStatus.CLAIMED] },
        kioskId: { not: null },
      },
      include: { kiosk: true },
      take: 10,
    });

    for (const job of activeJobs) {
      if (!job.kioskId) continue;

      const newProgress = Math.min(100, job.progress + 20);

      if (newProgress >= 100) {
        // Complete job
        await kiosksService.completeJob(job.kioskId, job.id);
        logger.info({ jobId: job.id, kioskId: job.kioskId }, 'Simulator: Completed print job');
      } else {
        // Report incremental progress with slight thermal fluctuation
        const tempFluctuation = Math.round(35 + Math.random() * 4);
        await kiosksService.reportJobProgress(job.kioskId, job.id, {
          progress: newProgress,
          temperature: tempFluctuation,
        });
        logger.debug({ jobId: job.id, progress: newProgress }, 'Simulator: Advanced job progress');
      }
    }
  }
}

export const simulatorService = new SimulatorService();


