import { Request, Response, NextFunction } from 'express';
import { zonesService } from './zones.service.js';

export class ZonesController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await zonesService.getZones();
      res.json({
        success: true,
        data: zones,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const zonesController = new ZonesController();

