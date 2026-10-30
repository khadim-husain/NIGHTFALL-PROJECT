import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocketServer } from './modules/realtime/socket.js';
import { simulatorService } from './modules/simulator/simulator.service.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Start simulator if enabled
if (env.SIMULATOR_AUTO_START) {
  simulatorService.start();
}

server.listen(env.PORT, () => {
  logger.info('=====================================================');
  logger.info('🚀 Nightfall Platform Backend Server listening on port %d', env.PORT);
  logger.info('📡 API Endpoint: http://localhost:%d/api/v1', env.PORT);
  logger.info('📖 OpenAPI Docs: http://localhost:%d/api/docs', env.PORT);
  logger.info('⚡ Real-time Socket.IO enabled');
  logger.info('=====================================================');
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info('Received %s. Initiating graceful shutdown...', signal);
  simulatorService.stop();

  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server, app, io };

