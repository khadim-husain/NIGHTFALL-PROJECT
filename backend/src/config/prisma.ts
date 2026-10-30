import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log queries in debug mode only
(prisma as any).$on?.('query', (e: any) => {
  logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Database Query');
});

(prisma as any).$on?.('error', (e: any) => {
  logger.error(e, 'Database Error');
});

(prisma as any).$on?.('warn', (e: any) => {
  logger.warn(e, 'Database Warning');
});

