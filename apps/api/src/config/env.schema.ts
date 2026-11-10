import { isIP } from 'node:net';
import path from 'node:path';
import { z } from 'zod';

/** apps/api directory: two levels up from both src/config and dist/config. */
export const API_ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
const TRUST_PROXY_PRESETS: ReadonlySet<string> = new Set(['loopback', 'linklocal', 'uniquelocal']);

const portSchema = z.coerce.number().int().min(1).max(65_535);

function parseUrl(value: string): URL | undefined {
  return URL.canParse(value) ? new URL(value) : undefined;
}

function isPlainHttpUrl(url: URL): boolean {
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.username === '' &&
    url.password === '' &&
    url.search === '' &&
    url.hash === ''
  );
}

const basePathSchema = z
  .string()
  .regex(/^(\/[A-Za-z0-9._~-]+)+$/, 'must start with "/" and must not end with "/" (e.g. /api/v1)');

const publicUrlSchema = z.string().transform((value, ctx) => {
  const url = parseUrl(value);
  if (url === undefined || !isPlainHttpUrl(url)) {
    ctx.addIssue({
      code: 'custom',
      message: 'must be an absolute http(s) URL without credentials, query or fragment',
    });
    return z.NEVER;
  }
  return url.href.replace(/\/+$/, '');
});

const originListSchema = z.string().transform((value, ctx) => {
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  const origins = entries.map((entry) => {
    const url = parseUrl(entry);
    return url !== undefined && isPlainHttpUrl(url) && url.pathname === '/' ? url.origin : undefined;
  });
  if (origins.length === 0 || origins.includes(undefined)) {
    ctx.addIssue({
      code: 'custom',
      message: 'must be a comma-separated list of http(s) origins without a path, e.g. http://localhost:3000',
    });
    return z.NEVER;
  }
  return [...new Set(origins.filter((origin) => origin !== undefined))];
});

function isTrustedProxyEntry(entry: string): boolean {
  if (TRUST_PROXY_PRESETS.has(entry)) return true;
  const [address = '', prefix, ...rest] = entry.split('/');
  const ipVersion = isIP(address);
  if (ipVersion === 0 || rest.length > 0) return false;
  if (prefix === undefined) return true;
  return /^\d{1,3}$/.test(prefix) && Number(prefix) <= (ipVersion === 4 ? 32 : 128);
}

const trustProxySchema = z.string().transform((raw, ctx): boolean | number | string => {
  const value = raw.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d{1,3}$/.test(value)) return Number(value);
  const entries = value.split(',').map((entry) => entry.trim());
  if (entries.every(isTrustedProxyEntry)) return entries.join(',');
  ctx.addIssue({
    code: 'custom',
    message: 'must be true, false, a hop count or a comma-separated list of IP addresses/subnets',
  });
  return z.NEVER;
});

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

    API_PORT: portSchema.default(4000),
    API_BASE_PATH: basePathSchema.default('/api/v1'),
    API_PUBLIC_URL: publicUrlSchema.prefault('http://localhost:4000'),
    WEB_ORIGIN: originListSchema.prefault('http://localhost:3000,http://localhost:3001'),
    TRUST_PROXY: trustProxySchema.default(false),

    JWT_ACCESS_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(3600)
      .max(90 * 24 * 3600)
      .default(1_209_600),

    DATABASE_HOST: z.string().min(1).default('localhost'),
    DATABASE_PORT: portSchema.default(5432),
    DATABASE_NAME: z.string().min(1),
    DATABASE_USERNAME: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_SCHEMA: z
      .string()
      .regex(/^[a-z_][a-z0-9_]{0,62}$/, 'must be a lowercase PostgreSQL identifier')
      .default('public'),
    DATABASE_SSL: z.stringbool().default(false),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    DATABASE_LOGGING: z.stringbool().default(false),

    UPLOADS_DIR: z
      .string()
      .transform((dir) => path.resolve(API_ROOT_DIR, dir))
      .prefault('storage/uploads'),
  })
  .superRefine((env, ctx) => {
    if (env.REFRESH_TOKEN_TTL_SECONDS <= env.ACCESS_TOKEN_TTL_SECONDS) {
      ctx.addIssue({
        code: 'custom',
        path: ['REFRESH_TOKEN_TTL_SECONDS'],
        message: 'must be greater than ACCESS_TOKEN_TTL_SECONDS',
      });
    }
  });

export type Env = z.output<typeof envSchema>;
export type NodeEnv = Env['NODE_ENV'];

/** Lists every problem by variable name; values are never echoed because they may be secrets. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';

  constructor(readonly problems: readonly string[]) {
    super(`Invalid environment configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
  }
}

function describeIssue(issue: z.core.$ZodIssue, provided: Readonly<Record<string, string>>): string {
  const [variable] = issue.path;
  if (typeof variable !== 'string') return `(environment): ${issue.message}`;
  return provided[variable] === undefined ? `${variable}: is required` : `${variable}: ${issue.message}`;
}

/** Validates raw variables. Blank values count as unset, so `KEY=` in .env falls back to the default. */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const provided: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value.trim() !== '') provided[key] = value;
  }

  const result = envSchema.safeParse(provided);
  if (!result.success) {
    throw new EnvValidationError(result.error.issues.map((issue) => describeIssue(issue, provided)));
  }
  return result.data;
}
