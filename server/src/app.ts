import path from 'node:path';
import express, { type Express } from 'express';
import cors, { type CorsOptionsDelegate } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import apiRouter from './routes';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { UPLOADS_ROOT } from './utils/fileStorage';

const ANGULAR_DIST_PATH =
  env.angularDistPath ?? path.join(__dirname, '../../dist/gestion-documental-hegewisch/browser');

const LOCALHOST_ORIGIN = /^https?:\/\/localhost:\d+$/;

/**
 * En el monolito, produccion sirve el frontend y la API desde el mismo origen (sin CORS de por medio).
 * En desarrollo, el proxy de Angular ya evita CORS para el flujo normal; esto solo cubre llamadas
 * directas al backend (Postman, otra pestaña, un puerto distinto de ng serve) sin atarse a un puerto fijo.
 */
const corsOriginDelegate: CorsOptionsDelegate = (req, callback) => {
  const origin = req.headers.origin;
  const permitido = !origin || (!env.isProduction && LOCALHOST_ORIGIN.test(origin)) || origin === env.corsOrigin;
  callback(null, { origin: permitido });
};

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  app.use(cors(corsOriginDelegate));
  app.use(express.json());

  app.use('/api', apiRouter);
  app.use('/api', notFoundMiddleware);

  app.use('/uploads', express.static(UPLOADS_ROOT));
  app.use('/uploads', notFoundMiddleware);
  app.use(express.static(ANGULAR_DIST_PATH));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(ANGULAR_DIST_PATH, 'index.html'));
  });

  app.use(errorMiddleware);

  return app;
}
