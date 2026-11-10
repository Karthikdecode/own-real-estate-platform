import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { UPLOADS_ROUTE } from './common/constants/http.js';
import { createCorsOptions } from './config/cors.config.js';
import { env } from './config/env.js';
import { createHelmetOptions } from './config/helmet.config.js';
import { createOpenApiDocument, mountApiDocs } from './docs/swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { assignRequestId } from './middlewares/request-id.middleware.js';
import { createRequestLogger } from './middlewares/request-logger.middleware.js';
import { createUploadsStaticMiddleware } from './middlewares/uploads-static.middleware.js';
import { createVerifyOrigin } from './middlewares/verify-origin.middleware.js';
import { HEALTH_PATH } from './modules/health/health.routes.js';
import { createApiRouter, type AppDependencies } from './routes.js';
import { logger } from './utils/logger.js';

export type { AppDependencies } from './routes.js';

export const JSON_BODY_LIMIT = '25mb';

export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(assignRequestId);
  // Logged right after the id is assigned, so requests rejected by CORS, the origin check or the
  // body parser still produce exactly one access-log line.
  app.use(
    createRequestLogger({ logger, quietPaths: [`${env.API_BASE_PATH}${HEALTH_PATH}`] }),
  );
  app.use(helmet(createHelmetOptions(env.NODE_ENV)));
  app.use(cors(createCorsOptions(env.WEB_ORIGIN)));
  app.use(createVerifyOrigin([...env.WEB_ORIGIN, new URL(env.API_PUBLIC_URL).origin]));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.use(UPLOADS_ROUTE, createUploadsStaticMiddleware(env.UPLOADS_DIR));
  app.use(env.API_BASE_PATH, createApiRouter(deps));
  mountApiDocs(app, createOpenApiDocument());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
