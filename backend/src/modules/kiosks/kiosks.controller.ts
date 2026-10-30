import { Request, Response, NextFunction } from 'express';
import { kiosksService } from './kiosks.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class KiosksController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kiosks = await kiosksService.getAllKiosks();
      if (req.query.format === 'envelope') {
        res.json({ success: true, data: kiosks });
      } else {
        res.json(kiosks);
      }
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kiosk = await kiosksService.getKioskById(String(req.params.id));
      res.json({
        success: true,
        data: kiosk,
      });
    } catch (err) {
      next(err);
    }
  }

  public async heartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await kiosksService.recordHeartbeat(String(req.params.kioskId), req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async restart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user?.email || 'admin@nightfall.io';
      const updated = await kiosksService.restartKiosk(String(req.params.id), actor);
      res.json({
        success: true,
        data: updated,
        message: `Kiosk ${req.params.id} soft restart command dispatched.`,
      });
    } catch (err) {
      next(err);
    }
  }

  public async testPrint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user?.email || 'admin@nightfall.io';
      const result = await kiosksService.testPrint(String(req.params.id), actor);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user?.email || 'security@nightfall.io';
      const revoked = await kiosksService.revokeKiosk(String(req.params.id), actor);
      res.json({
        success: true,
        data: revoked,
        message: `Kiosk ${req.params.id} has been revoked.`,
      });
    } catch (err) {
      next(err);
    }
  }

  public async claimJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kioskId = String(req.params.kioskId);
      const claimedJob = await kiosksService.claimNextJob(kioskId);
      if (!claimedJob) {
        res.status(204).send(); // No Content: Queue empty
        return;
      }
      res.json({
        success: true,
        data: claimedJob,
      });
    } catch (err) {
      next(err);
    }
  }

  public async reportProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kioskId = String(req.params.kioskId);
      const jobId = String(req.params.jobId);
      const updated = await kiosksService.reportJobProgress(kioskId, jobId, req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async completeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kioskId = String(req.params.kioskId);
      const jobId = String(req.params.jobId);
      const completed = await kiosksService.completeJob(kioskId, jobId);
      res.json({
        success: true,
        data: completed,
      });
    } catch (err) {
      next(err);
    }
  }

  public async failJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kioskId = String(req.params.kioskId);
      const jobId = String(req.params.jobId);
      const { reason, isUncertain } = req.body;
      const failed = await kiosksService.failJob(kioskId, jobId, reason, isUncertain);
      res.json({
        success: true,
        data: failed,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const kiosksController = new KiosksController();
