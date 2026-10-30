import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler.js';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Access forbidden: Operation requires one of [${allowedRoles.join(', ')}] permissions, but your role is ${req.user.role}.`,
          403,
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireOperatorOrAdmin = requireRole([UserRole.ADMIN, UserRole.OPERATOR]);

