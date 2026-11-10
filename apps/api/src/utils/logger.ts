import { hostname } from 'node:os';
import {
  pino,
  stdTimeFunctions,
  type DestinationStream,
  type LevelWithSilent,
  type Logger,
} from 'pino';
import { env } from '../config/env.js';

export const SERVICE_NAME = 'real-estate-api';

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
];

export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  // SQL parameters and PostgreSQL error details can contain user data.
  'err.parameters',
  'err.detail',
  'err.driverError.detail',
  ...SENSITIVE_FIELDS.flatMap((field) => [field, `*.${field}`, `*.*.${field}`]),
];

export interface LoggerSettings {
  readonly level: LevelWithSilent;
  readonly pretty: boolean;
}

export function createLogger(settings: LoggerSettings, destination?: DestinationStream): Logger {
  return pino(
    {
      level: settings.level,
      base: { service: SERVICE_NAME, pid: process.pid, hostname: hostname() },
      timestamp: stdTimeFunctions.isoTime,
      redact: { paths: LOG_REDACT_PATHS, censor: '[REDACTED]' },
      ...(settings.pretty && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }),
    },
    destination,
  );
}

export const logger = createLogger({
  level: env.LOG_LEVEL,
  pretty: env.NODE_ENV === 'development',
});
