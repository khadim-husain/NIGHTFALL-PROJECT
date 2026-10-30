import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../config/prisma.js';
import { firebaseAuth } from '../../config/firebase.js';
import { UserRole } from '@prisma/client';

export let io: SocketIOServer | null = null;

interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null) ||
        socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Allow anonymous guest connection in read-only public room if allowed, or reject
        // For dashboard telemetry, allow public/demo room with limited scope
        (socket as any).user = null;
        return next();
      }

      let email: string | undefined;

      if (firebaseAuth) {
        try {
          const decoded = await firebaseAuth.verifyIdToken(token);
          email = decoded.email;
        } catch {
          // fallback to JWT if demo auth enabled
        }
      }

      if (!email && env.ALLOW_DEMO_AUTH) {
        try {
          const payload = jwt.verify(token, env.JWT_SECRET) as any;
          email = payload.email;
        } catch {
          // ignore
        }
      }

      if (email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && user.status === 'ACTIVE') {
          (socket as any).user = {
            id: user.id,
            email: user.email,
            role: user.role,
          } as SocketUser;
        }
      }

      next();
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Socket.IO handshake authentication error');
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser | undefined;
    logger.info({ socketId: socket.id, userEmail: user?.email || 'Anonymous' }, 'Socket client connected');

    // Automatically join default rooms
    socket.join('public:status');

    if (user) {
      // Individual customer room for their private order events
      socket.join(`user:${user.id}`);

      // Operators and Admins join the operations monitoring room
      if (user.role === UserRole.ADMIN || user.role === UserRole.OPERATOR) {
        socket.join('ops:dashboard');
        socket.join('ops:kiosks');
        socket.join('ops:incidents');
      }
    }

    // Allow client to subscribe to specific kiosk telemetry room
    socket.on('subscribe:kiosk', (kioskId: string) => {
      socket.join(`kiosk:${kioskId.toUpperCase()}`);
      logger.debug({ socketId: socket.id, kioskId }, 'Subscribed to kiosk telemetry');
    });

    socket.on('unsubscribe:kiosk', (kioskId: string) => {
      socket.leave(`kiosk:${kioskId.toUpperCase()}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket client disconnected');
    });
  });

  return io;
}

