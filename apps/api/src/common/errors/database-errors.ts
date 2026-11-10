import {
  CannotExecuteNotConnectedError,
  CannotGetEntityManagerNotConnectedError,
  ConnectionIsNotSetError,
  QueryFailedError,
} from 'typeorm';

const PG_UNIQUE_VIOLATION = '23505';

/** Network failures (AggregateError on dual-stack hosts) and PostgreSQL shutdown/overload codes. */
const UNAVAILABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  '57P01',
  '57P02',
  '57P03',
  '53300',
]);

const NOT_CONNECTED_ERRORS = [
  CannotExecuteNotConnectedError,
  CannotGetEntityManagerNotConnectedError,
  ConnectionIsNotSetError,
];

/** Messages of connection failures that carry no error code (TypeORM before initialize(), pg-pool). */
const UNAVAILABLE_ERROR_MESSAGES: ReadonlySet<string> = new Set([
  'Driver not Connected',
  'timeout exceeded when trying to connect',
  'Connection terminated unexpectedly',
]);

/** SQLSTATE of a failed query, or the system error code of a failed connection attempt. */
export function getDatabaseErrorCode(error: unknown): string | undefined {
  const source: unknown = error instanceof QueryFailedError ? error.driverError : error;
  if (typeof source !== 'object' || source === null || !('code' in source)) return undefined;
  return typeof source.code === 'string' ? source.code : undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof QueryFailedError && getDatabaseErrorCode(error) === PG_UNIQUE_VIOLATION;
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (NOT_CONNECTED_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) return true;
  if (error instanceof Error && UNAVAILABLE_ERROR_MESSAGES.has(error.message)) return true;
  const code = getDatabaseErrorCode(error);
  // SQLSTATE class 08 = connection exception.
  return code !== undefined && (code.startsWith('08') || UNAVAILABLE_ERROR_CODES.has(code));
}
