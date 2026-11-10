import type { DataSourceOptions } from 'typeorm';
import { PinoTypeOrmLogger } from '../database/typeorm-logger.js';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export const MIGRATIONS_TABLE_NAME = 'typeorm_migrations';

export interface DatabaseSources {
  readonly entities: NonNullable<DataSourceOptions['entities']>;
  readonly migrations: NonNullable<DataSourceOptions['migrations']>;
}

export function createDatabaseOptions(sources: DatabaseSources): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    schema: env.DATABASE_SCHEMA,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
    applicationName: 'real-estate-api',
    entities: sources.entities,
    migrations: sources.migrations,
    migrationsTableName: MIGRATIONS_TABLE_NAME,
    migrationsRun: false,
    synchronize: false,
    // Extensions are created by migrations; uuid keys default to the built-in gen_random_uuid().
    installExtensions: false,
    uuidExtension: 'pgcrypto',
    logging: env.DATABASE_LOGGING,
    logger: new PinoTypeOrmLogger(logger, env.DATABASE_LOGGING),
    maxQueryExecutionTime: 1000,
    poolSize: env.DATABASE_POOL_MAX,
    connectTimeoutMS: 5000,
    extra: {
      idleTimeoutMillis: 30_000,
      statement_timeout: 15_000,
      // Hand-written SQL (migrations, raw queries) uses unqualified names: pin them to the schema.
      options: `-c search_path=${env.DATABASE_SCHEMA}`,
    },
  };
}
