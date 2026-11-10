import type { Logger } from 'pino';
import type { Logger as TypeOrmLogger } from 'typeorm';

/**
 * Routes TypeORM output through pino instead of the console. SQL text is logged only when
 * DATABASE_LOGGING is on, and parameters never are (they may hold password hashes or personal
 * data). Failed queries are not logged here: the error middleware logs the failed request once.
 */
export class PinoTypeOrmLogger implements TypeOrmLogger {
  constructor(
    private readonly logger: Logger,
    private readonly logQueries: boolean,
  ) {}

  logQuery(query: string): void {
    if (this.logQueries) this.logger.debug({ query }, 'SQL query');
  }

  logQueryError(error: string | Error, query: string): void {
    if (this.logQueries) this.logger.debug({ err: error, query }, 'SQL query failed');
  }

  logQuerySlow(durationMs: number, query: string): void {
    this.logger.warn({ durationMs, query }, 'Slow SQL query');
  }

  logSchemaBuild(message: string): void {
    if (this.logQueries) this.logger.debug(message);
  }

  logMigration(message: string): void {
    this.logger.info(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown): void {
    if (level === 'warn') {
      this.logger.warn({ detail: message }, 'TypeORM warning');
      return;
    }
    this.logger.debug({ detail: message }, 'TypeORM message');
  }
}
