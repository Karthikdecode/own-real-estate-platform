import './docs/zod-openapi.js';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { UPLOADS_ROUTE } from './common/constants/http.js';
import { env } from './config/env.js';
import { API_DOCS_PATH } from './config/swagger.config.js';
import { AppDataSource } from './database/data-source.js';
import {
  connectDatabase,
  createDatabaseHealthCheck,
  type DatabaseConnection,
} from './database/database.js';
import { LocalDiskStorage } from './modules/uploads/local-disk.storage.js';
import { logger } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function registerShutdownHandlers(server: Server, database: DatabaseConnection): void {
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await closeServer(server);
      await database.disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }
}

function start(): void {
  // Non-blocking: the API serves requests (health answers 503) while the database is unreachable.
  const database = connectDatabase(AppDataSource, logger);
  const storage = new LocalDiskStorage({
    rootDir: env.UPLOADS_DIR,
    publicBaseUrl: `${env.API_PUBLIC_URL}${UPLOADS_ROUTE}`,
  });
  const app = createApp({ databaseHealth: createDatabaseHealthCheck(AppDataSource), storage });

  const server = app.listen(env.API_PORT, (error) => {
    if (error) {
      logger.fatal({ err: error }, `Could not listen on port ${String(env.API_PORT)}`);
      process.exit(1);
    }
    logger.info(`API listening at ${env.API_PUBLIC_URL}${env.API_BASE_PATH}`);
    logger.info(`Swagger UI at ${env.API_PUBLIC_URL}${API_DOCS_PATH}`);
  });

  registerShutdownHandlers(server, database);
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

try {
  start();
} catch (error) {
  logger.fatal({ err: error }, 'API failed to start');
  process.exit(1);
}
