import path from 'node:path';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../config/database.config.js';
import { ENTITIES } from './entities/index.js';

/**
 * The application DataSource and the `-d` target of the TypeORM CLI, which requires exactly one
 * exported DataSource. The migrations glob is relative to this module, so it matches the .ts
 * sources under tsx and the compiled .js files in dist.
 */
export const AppDataSource = new DataSource(
  createDatabaseOptions({
    entities: ENTITIES,
    migrations: [path.join(import.meta.dirname, 'migrations', '*.{ts,js}')],
  }),
);
