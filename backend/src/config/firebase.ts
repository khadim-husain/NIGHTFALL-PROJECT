import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from './logger.js';

let firebaseApp: admin.app.App | null = null;
let firebaseAuth: admin.auth.Auth | null = null;

if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseAuth = admin.auth(firebaseApp);
    logger.info('Firebase Admin SDK initialized successfully for project: %s', env.FIREBASE_PROJECT_ID);
  } catch (err) {
    logger.error(err, 'Failed to initialize Firebase Admin SDK with provided credentials');
  }
} else {
  logger.warn(
    'Firebase Admin credentials not fully configured. Running in Local Dev/Demo mode with verified JWT fallback.'
  );
}

export { firebaseAuth, firebaseApp };

