import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class PaymentsController {
  public async simulatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to process payment.', 401, 'UNAUTHORIZED');
      }

      const result = await paymentsService.processSimulatedPayment(req.user, req.body);
      res.status(result.idempotentReplay ? 200 : 201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();

