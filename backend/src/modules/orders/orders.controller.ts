import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import { calculateOrderPrice } from '../../config/pricing.js';
import { AppError } from '../../middleware/errorHandler.js';

export class OrdersController {
  public async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quote = calculateOrderPrice(req.body);
      res.json({
        success: true,
        data: quote,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Optional user context: if user is logged in, filter accordingly
      const user = req.user || { id: 'anonymous', role: 'ADMIN' as any };
      const query = {
        status: req.query.status as any,
        kioskId: req.query.kioskId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await ordersService.getOrders(user, query);
      // If requested directly by frontend (which expects array of PrintOrder[]), support both
      res.json(result.orders);
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ordersService.getOrderById(String(req.params.id), req.user);
      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to create orders.', 401, 'UNAUTHORIZED');
      }

      const order = await ordersService.createOrder(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const cancelled = await ordersService.cancelOrder(String(req.params.id), req.user);
      res.json({
        success: true,
        data: cancelled,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const pdfBuffer = await ordersService.generateReceiptPdf(orderId, req.user);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Receipt-${orderId.replace('#', '')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  public async reprint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to request reprint.', 401, 'UNAUTHORIZED');
      }

      const orderId = String(req.params.id);
      const reprint = await ordersService.requestReprint(orderId, req.user);
      res.status(201).json({
        success: true,
        data: reprint,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
