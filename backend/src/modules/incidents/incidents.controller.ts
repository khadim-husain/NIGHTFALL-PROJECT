import { Request, Response, NextFunction } from 'express';
import { incidentsService } from './incidents.service.js';

export class IncidentsController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as any,
        severity: req.query.severity as any,
        kioskId: req.query.kioskId as string,
      };
      const incidents = await incidentsService.getIncidents(filters);
      // Return plain array matching frontend expectation
      res.json(incidents);
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inc = await incidentsService.getIncidentById(String(req.params.id));
      res.json({
        success: true,
        data: inc,
      });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inc = await incidentsService.createIncident(req.body);
      res.status(201).json({
        success: true,
        data: inc,
      });
    } catch (err) {
      next(err);
    }
  }

  public async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user?.email || 'admin@nightfall.io';
      const resolved = await incidentsService.resolveIncident(String(req.params.id), actor);
      res.json({
        success: true,
        data: resolved,
        message: `Incident ${req.params.id} resolved.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const incidentsController = new IncidentsController();
