import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from './errorHandler.js';
import { Kiosk } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      kiosk?: Kiosk;
    }
  }
}

export function hashKioskKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function authenticateKiosk(req: Request, res: Response, next: NextFunction): Promise<void> {
  const kioskId = ((req.headers['x-kiosk-id'] as string) || (req.params.kioskId as string) || '') as string;
  const kioskKey = (req.headers['x-kiosk-key'] as string) || '';

  if (!kioskId || !kioskKey) {
    next(new AppError('Kiosk authentication required. Both x-kiosk-id and x-kiosk-key headers are required.', 401, 'KIOSK_AUTH_REQUIRED'));
    return;
  }

  try {
    const kiosk = await prisma.kiosk.findUnique({
      where: { id: kioskId.toUpperCase() },
    });

    if (!kiosk) {
      next(new AppError(`Kiosk '${kioskId}' is not provisioned in the network.`, 401, 'KIOSK_NOT_FOUND'));
      return;
    }

    if (kiosk.isRevoked) {
      next(new AppError(`Kiosk '${kioskId}' credentials have been revoked by security operations. Access denied.`, 403, 'KIOSK_REVOKED'));
      return;
    }

    // Hash provided key and compare using timingSafeEqual
    const computedHash = hashKioskKey(kioskKey);
    const hashBuf = Buffer.from(computedHash, 'utf8');
    const storedBuf = Buffer.from(kiosk.apiKeyHash, 'utf8');

    if (hashBuf.length !== storedBuf.length || !crypto.timingSafeEqual(hashBuf, storedBuf)) {
      next(new AppError('Invalid kiosk secret key credential.', 401, 'INVALID_KIOSK_CREDENTIALS'));
      return;
    }

    // Ensure that if route contains :kioskId param, it strictly matches the authenticated kiosk
    const paramKioskId = req.params.kioskId as string | undefined;
    if (paramKioskId && paramKioskId.toUpperCase() !== kiosk.id.toUpperCase()) {
      next(new AppError(`Kiosk credential mismatch: Authenticated as ${kiosk.id} but target path is ${paramKioskId}.`, 403, 'KIOSK_MISMATCH'));
      return;
    }

    req.kiosk = kiosk;
    next();
  } catch (err: any) {
    next(err);
  }
}
