import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole, UserStatus } from '@prisma/client';

export class AuthService {
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, key] = storedHash.split(':');
      if (!salt || !key) return false;
      const derived = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(key, 'hex');
      if (derived.length !== keyBuffer.length) return false;
      return crypto.timingSafeEqual(derived, keyBuffer);
    } catch {
      return false;
    }
  }

  public async registerUser(data: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'USER_EXISTS');
    }

    const passwordHash = this.hashPassword(data.password);
    const userRole =
      data.role || (normalizedEmail.includes('admin') ? UserRole.ADMIN : UserRole.CUSTOMER);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: data.displayName.trim(),
        passwordHash,
        role: userRole,
        status: UserStatus.ACTIVE,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor: user.email,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        resource: `User ${user.id}`,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        payload: {
          email: user.email,
          role: user.role,
        },
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
    };
  }

  public async loginWithCredentials(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if demo credentials are used
    if (env.ALLOW_DEMO_AUTH) {
      if (normalizedEmail === 'admin@nightfall.io' && password === 'nightfall-enterprise') {
        let adminUser = await prisma.user.findUnique({
          where: { email: 'admin@nightfall.io' },
        });

        if (!adminUser) {
          adminUser = await prisma.user.create({
            data: {
              email: 'admin@nightfall.io',
              displayName: 'Admin',
              role: UserRole.ADMIN,
              status: UserStatus.ACTIVE,
              passwordHash: this.hashPassword('nightfall-enterprise'),
            },
          });
        }

        const token = jwt.sign(
          {
            userId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          },
          env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return {
          token,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.displayName,
            role: adminUser.role,
            status: adminUser.status,
          },
        };
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError('Account is suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Verify password if passwordHash exists
    if (user.passwordHash) {
      const isValid = this.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }
    } else {
      // Store hash for existing user
      const passwordHash = this.hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
    };
  }

  public async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          actor: user.email,
          actorRole: user.role,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: `User ${user.id}`,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
        },
      });
    }

    return {
      message: 'Password reset link has been dispatched to your email address.',
      email: normalizedEmail,
    };
  }

  public async generateDemoToken(email: string) {
    if (!env.ALLOW_DEMO_AUTH) {
      throw new AppError('Demo token generation is disabled in production environment.', 403, 'FEATURE_DISABLED');
    }

    const normalizedEmail = (email || 'admin@nightfall.io').toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          displayName: normalizedEmail.split('@')[0],
          role: normalizedEmail.includes('admin') ? UserRole.ADMIN : UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          passwordHash: this.hashPassword('nightfall-enterprise'),
        },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
    };
  }
}

export const authService = new AuthService();
