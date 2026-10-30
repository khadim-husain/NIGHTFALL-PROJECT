import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allows Swagger UI inline scripts
    })
  );

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, kiosk workers) or matched origins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-kiosk-id', 'x-kiosk-key'],
    })
  );

  // Rate Limiting
  app.use(standardRateLimiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging
  app.use(requestLogger);

  // Swagger OpenAPI Documentation
  try {
    const openapiPath = path.resolve(__dirname, '../docs/openapi.json');
    if (fs.existsSync(openapiPath)) {
      const openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
      app.get('/docs', (req, res) => res.redirect('/api/docs'));
    }
  } catch (err) {
    console.warn('Could not load OpenAPI specification for /api/docs', err);
  }

  // Mount API v1
  app.use('/api/v1', apiRouter);

  // 404 Fallback
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route '${req.method} ${req.path}' does not exist on this server.`,
      },
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

