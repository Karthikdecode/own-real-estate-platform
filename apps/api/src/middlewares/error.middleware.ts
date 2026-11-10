import type { ApiErrorResponse } from '@real-estate/contracts';
import type { ErrorRequestHandler } from 'express';
import { normalizeError } from '../common/errors/normalize-error.js';
import { recordRequestError } from './request-logger.middleware.js';

/**
 * The only place that turns errors into the contract error envelope. Client-facing messages come
 * from AppError; unexpected errors become a generic 500 so stack traces, SQL and internal messages
 * never leak. Logging happens once, on the request's access-log line.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    // The response is already streaming; Express can only abort the connection.
    next(error);
    return;
  }

  const appError = normalizeError(error);
  recordRequestError(res, {
    code: appError.code,
    message: appError.message,
    error: appError.statusCode >= 500 ? error : undefined,
  });

  const body: ApiErrorResponse = {
    success: false,
    message: appError.message,
    code: appError.code,
    errors: [...appError.details],
    requestId: req.requestId,
  };
  res.status(appError.statusCode).json(body);
};
