import { existsSync } from 'node:fs';
import path from 'node:path';
import { EnvValidationError, parseEnv, type Env } from './env.schema.js';

/** Monorepo root .env: four levels up from src/config (tsx) and dist/config (node). */
const ROOT_ENV_FILE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '.env');

function loadRootEnvFile(): void {
  if (process.env.NODE_ENV === 'test' || !existsSync(ROOT_ENV_FILE)) return;
  // loadEnvFile never overwrites variables that are already set, so the real environment wins.
  process.loadEnvFile(ROOT_ENV_FILE);
}

function loadEnvOrExit(): Env {
  loadRootEnvFile();
  try {
    return parseEnv(process.env);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

export const env = loadEnvOrExit();
