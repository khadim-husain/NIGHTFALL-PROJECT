import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { firebaseAuth } from '../config/firebase.js';
import { AppError } from './errorHandler.js';
import { UserRole, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  firebaseUid?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required. Missing Bearer token in Authorization header.', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next(new AppError('Invalid Authorization header format.', 401, 'INVALID_TOKEN'));
    return;
  }

  let email: string | undefined;
  let firebaseUid: string | undefined;

  // 1. Try Firebase verification if Firebase Admin is initialized
  if (firebaseAuth) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      email = decoded.email;
      firebaseUid = decoded.uid;
    } catch (fbErr: any) {
      // If Firebase verification failed and demo auth is NOT permitted, reject immediately
      if (!env.ALLOW_DEMO_AUTH) {
        next(new AppError(`Invalid or expired Firebase ID token: ${fbErr.message}`, 401, 'INVALID_FIREBASE_TOKEN'));
        return;
      }
    }
  }

  // 2. If no email resolved from Firebase and ALLOW_DEMO_AUTH is true, try JWT token
  if (!email && env.ALLOW_DEMO_AUTH) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      email = payload.email;
      firebaseUid = payload.firebaseUid;
    } catch (jwtErr: any) {
      next(new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN'));
      return;
    }
  }

  if (!email) {
    next(new AppError('Authentication token could not be verified.', 401, 'UNAUTHORIZED'));
    return;
  }

  // 3. Load authoritative server-side user record from PostgreSQL
  try {
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(firebaseUid ? [{ firebaseUid }] : [])],
      },
    });

    if (!dbUser) {
      // If user is verified by Firebase but record doesn't exist yet, provision initial customer account
      dbUser = await prisma.user.create({
        data: {
          email,
          displayName: email.split('@')[0],
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          firebaseUid: firebaseUid || null,
        },
      });
    }

    // 4. Verify account status
    if (dbUser.status !== UserStatus.ACTIVE) {
      next(new AppError('Account is suspended or deactivated. Access denied.', 403, 'ACCOUNT_SUSPENDED'));
      return;
    }

    // Set request user from authoritative PostgreSQL row (never trusting client role!)
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      role: dbUser.role,
      status: dbUser.status,
      firebaseUid: dbUser.firebaseUid,
    };

    next();
  } catch (dbErr: any) {
    next(dbErr);
  }
}

/**
 * Optional authentication: populates req.user if a valid token is provided, but does not block if missing
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  return authenticate(req, res, next);
}

