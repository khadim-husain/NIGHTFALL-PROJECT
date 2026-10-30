import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from './audit-logs.service.js';

export class AuditLogsController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        actor: req.query.actor as string,
        action: req.query.action as string,
        status: req.query.status as any,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };
      const logs = await auditLogsService.getAuditLogs(filters);
      // Return plain array matching frontend expectation
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}

export const auditLogsController = new AuditLogsController();

