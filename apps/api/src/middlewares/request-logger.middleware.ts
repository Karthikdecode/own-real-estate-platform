import type { Request, RequestHandler, Response } from 'express';
import type { LevelWithSilent, Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { ErrorCode } from '../common/errors/error-codes.js';

export interface RequestErrorLogEntry {
  readonly code: ErrorCode;
  readonly message: string;
  /** Original thrown value; set only for 5xx so the access log carries its stack. */
  readonly error?: unknown;
}

const requestErrors = new WeakMap<Response, RequestErrorLogEntry>();

/**
 * Attaches a handled error to the request's single access-log line. The error middleware calls
 * this instead of logging, so every failed request is logged exactly once.
 */
export function recordRequestError(res: Response, entry: RequestErrorLogEntry): void {
  requestErrors.set(res, entry);
}

function withRecordedError(
  res: Response,
  logObject: Record<string, unknown>,
): Record<string, unknown> {
  const entry = requestErrors.get(res);
  if (entry === undefined) return logObject;
  if (entry.error === undefined) {
    return { ...logObject, error: { code: entry.code, message: entry.message } };
  }
  return { ...logObject, err: entry.error, errorCode: entry.code };
}

function getPathname(req: Request): string {
  return req.originalUrl.split('?', 1)[0] ?? req.originalUrl;
}

export interface RequestLoggerOptions {
  readonly logger: Logger;
  /** Paths such as the health check that are polled frequently and logged at debug level. */
  readonly quietPaths?: readonly string[];
}

export function createRequestLogger({
  logger,
  quietPaths = [],
}: RequestLoggerOptions): RequestHandler {
  const quiet: ReadonlySet<string> = new Set(quietPaths);

  return pinoHttp<Request, Response>({
    logger,
    genReqId: (req) => req.requestId,
    quietReqLogger: true,
    customAttributeKeys: { reqId: 'requestId' },
    customLogLevel: (req, res, error): LevelWithSilent => {
      if (quiet.has(getPathname(req))) return 'debug';
      if (error !== undefined || res.statusCode >= 500) return 'error';
      return res.statusCode >= 400 ? 'warn' : 'info';
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${req.originalUrl} ${String(res.statusCode)} ${String(responseTime)}ms`,
    customErrorMessage: (req, res) =>
      `${req.method} ${req.originalUrl} ${String(res.statusCode)}`,
    customSuccessObject: (_req, res, logObject: Record<string, unknown>) =>
      withRecordedError(res, logObject),
    customErrorObject: (_req, res, _error, logObject: Record<string, unknown>) =>
      withRecordedError(res, logObject),
  });
}
