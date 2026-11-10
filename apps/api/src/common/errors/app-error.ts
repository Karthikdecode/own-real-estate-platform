import type { ApiErrorDetail } from '@real-estate/contracts';
import type { RoadmapPhase } from '../constants/roadmap.js';
import { ERROR_CODES, ERROR_HTTP_STATUS, type ErrorCode } from './error-codes.js';

export interface AppErrorOptions {
  readonly details?: readonly ApiErrorDetail[];
  readonly cause?: unknown;
}

/** An expected, client-facing failure. Its message and details are safe to return to the caller. */
export class AppError extends Error {
  override readonly name = 'AppError';
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: readonly ApiErrorDetail[];

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code];
    this.details = options.details ?? [];
  }

  static validation(
    details: readonly ApiErrorDetail[],
    message = 'Request validation failed.',
  ): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, { details });
  }

  static invalidJson(): AppError {
    return new AppError(ERROR_CODES.INVALID_JSON, 'Request body is not valid JSON.');
  }

  static badRequest(message: string): AppError {
    return new AppError(ERROR_CODES.BAD_REQUEST, message);
  }

  static unauthenticated(message = 'Authentication is required.'): AppError {
    return new AppError(ERROR_CODES.UNAUTHENTICATED, message);
  }

  static invalidToken(): AppError {
    return new AppError(ERROR_CODES.INVALID_TOKEN, 'The access token is invalid.');
  }

  static tokenExpired(): AppError {
    return new AppError(ERROR_CODES.TOKEN_EXPIRED, 'The access token has expired.');
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN, message);
  }

  static forbiddenOrigin(): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN_ORIGIN, 'Requests from this origin are not allowed.');
  }

  static notFound(resource: string): AppError {
    return new AppError(ERROR_CODES.NOT_FOUND, `${resource} not found.`);
  }

  static routeNotFound(method: string, path: string): AppError {
    return new AppError(ERROR_CODES.ROUTE_NOT_FOUND, `Route ${method} ${path} not found.`);
  }

  static conflict(message: string): AppError {
    return new AppError(ERROR_CODES.CONFLICT, message);
  }

  static payloadTooLarge(message = 'Request body is too large.'): AppError {
    return new AppError(ERROR_CODES.PAYLOAD_TOO_LARGE, message);
  }

  static unsupportedMediaType(message: string): AppError {
    return new AppError(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE, message);
  }

  static rateLimited(): AppError {
    return new AppError(ERROR_CODES.RATE_LIMITED, 'Too many requests. Please try again later.');
  }

  static notImplemented(feature: string, phase: RoadmapPhase): AppError {
    return new AppError(
      ERROR_CODES.NOT_IMPLEMENTED,
      `${feature} is not implemented yet (planned for roadmap phase ${String(phase.number)}: ${phase.name}).`,
    );
  }

  static serviceUnavailable(message: string, cause?: unknown): AppError {
    return new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, message, { cause });
  }

  static internal(cause?: unknown): AppError {
    return new AppError(ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.', { cause });
  }
}
