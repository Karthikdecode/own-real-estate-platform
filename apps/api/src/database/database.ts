import { setTimeout as delay } from 'node:timers/promises';
import type { Logger } from 'pino';
import type { DataSourceOptions } from 'typeorm';
import { getDatabaseErrorCode, isDatabaseUnavailable } from '../common/errors/database-errors.js';

/** The part of a TypeORM DataSource the connection manager needs (a fake satisfies it in tests). */
export interface ConnectableDataSource {
  readonly options: DataSourceOptions;
  readonly isInitialized: boolean;
  initialize(): Promise<unknown>;
  destroy(): Promise<void>;
}

export interface QueryableDataSource {
  readonly isInitialized: boolean;
  query(sql: string): Promise<unknown>;
}

export interface DatabaseConnection {
  /** Resolves true once connected, or false when `disconnect()` stopped the retries first. */
  readonly ready: Promise<boolean>;
  /** Stops retrying and closes the pool if it was opened. */
  disconnect(): Promise<void>;
}

export interface ConnectRetryOptions {
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
}

export interface DatabaseHealthCheck {
  ping(): Promise<{ latencyMs: number }>;
}

function describeTarget(options: DataSourceOptions): string {
  if (options.type !== 'postgres') return options.type;
  return `${options.host ?? 'localhost'}:${String(options.port ?? 5432)}`;
}

function describeFailure(error: unknown): string {
  const code = getDatabaseErrorCode(error);
  const message = error instanceof Error ? error.message : '';
  return [code, message].filter((part) => part !== undefined && part !== '').join(' ') || 'unknown';
}

/**
 * Connects in the background with capped exponential backoff instead of crashing, so the API,
 * Swagger UI and the health endpoint (which answers 503) keep working while PostgreSQL is down.
 */
export function connectDatabase(
  dataSource: ConnectableDataSource,
  logger: Logger,
  { initialDelayMs = 2_000, maxDelayMs = 30_000 }: ConnectRetryOptions = {},
): DatabaseConnection {
  const target = describeTarget(dataSource.options);
  const stop = new AbortController();
  const isStopped = (): boolean => stop.signal.aborted;

  async function connectWithRetry(): Promise<boolean> {
    let delayMs = initialDelayMs;
    while (!isStopped()) {
      try {
        await dataSource.initialize();
        logger.info(`Connected to PostgreSQL at ${target}`);
        return true;
      } catch (error) {
        if (isStopped()) return false;
        const problem = isDatabaseUnavailable(error)
          ? `PostgreSQL is not reachable at ${target} - start it with pnpm db:up`
          : `PostgreSQL connection to ${target} failed`;
        logger.warn(
          { reason: describeFailure(error) },
          `${problem}; retrying in ${String(delayMs / 1000)}s`,
        );
        try {
          await delay(delayMs, undefined, { signal: stop.signal, ref: false });
        } catch {
          return false;
        }
        delayMs = Math.min(delayMs * 2, maxDelayMs);
      }
    }
    return false;
  }

  const ready = connectWithRetry();

  return {
    ready,
    async disconnect() {
      stop.abort();
      await ready;
      if (dataSource.isInitialized) await dataSource.destroy();
    },
  };
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  const timer = new AbortController();
  const timeout = delay(timeoutMs, undefined, { signal: timer.signal }).then(() => {
    throw new Error(message);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    timer.abort();
  }
}

/** Runs `SELECT 1` with a short timeout; throws when the pool is not initialised or unreachable. */
export function createDatabaseHealthCheck(
  dataSource: QueryableDataSource,
  timeoutMs = 2_000,
): DatabaseHealthCheck {
  return {
    async ping() {
      if (!dataSource.isInitialized) throw new Error('Database connection is not initialised.');
      const startedAt = performance.now();
      await withTimeout(
        dataSource.query('SELECT 1'),
        timeoutMs,
        `Database ping timed out after ${String(timeoutMs)}ms.`,
      );
      return { latencyMs: Math.round((performance.now() - startedAt) * 100) / 100 };
    },
  };
}
