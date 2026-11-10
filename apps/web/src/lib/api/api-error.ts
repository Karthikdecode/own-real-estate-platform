import type { ApiErrorDetail, ErrorCode } from '@real-estate/contracts';

/** Failures detected by the web client itself, when no valid API error envelope exists. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE';

export type ApiErrorCode = ErrorCode | ClientErrorCode;

export interface ApiErrorInit {
  /** HTTP status of the response, or 0 when no response was received. */
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: readonly ApiErrorDetail[];
  requestId?: string;
  cause?: unknown;
}

/** The only error type the API layer throws for a failed request. */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Field-level problems, e.g. `{ path: 'body.email', message, code }` for validation errors. */
  readonly details: readonly ApiErrorDetail[];
  /** Correlation id from the error body or the X-Request-Id header, for matching API logs. */
  readonly requestId: string | undefined;

  constructor({ status, code, message, details = [], requestId, cause }: ApiErrorInit) {
    super(message, cause === undefined ? undefined : { cause });
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
