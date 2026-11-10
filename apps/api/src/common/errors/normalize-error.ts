import { AppError } from './app-error.js';
import { isDatabaseUnavailable, isUniqueViolation } from './database-errors.js';

/** body-parser marks its errors with a `type`; anything not listed here is treated as a server error. */
const BODY_PARSER_ERRORS: ReadonlyMap<string, () => AppError> = new Map([
  ['entity.parse.failed', () => AppError.invalidJson()],
  ['entity.too.large', () => AppError.payloadTooLarge()],
  ['encoding.unsupported', () => AppError.unsupportedMediaType('Unsupported content encoding.')],
  ['charset.unsupported', () => AppError.unsupportedMediaType('Unsupported charset; send UTF-8.')],
  ['request.aborted', () => AppError.badRequest('The request was aborted by the client.')],
  ['request.size.invalid', () => AppError.badRequest('Request size does not match Content-Length.')],
]);

function getBodyParserErrorType(error: unknown): string | undefined {
  if (!(error instanceof Error) || !('type' in error)) return undefined;
  return typeof error.type === 'string' ? error.type : undefined;
}

/**
 * Maps any thrown value to an AppError whose message is safe to send. Unknown errors become a
 * generic 500 that keeps the original as `cause` for logging only.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const bodyParserErrorType = getBodyParserErrorType(error);
  const bodyParserError =
    bodyParserErrorType === undefined ? undefined : BODY_PARSER_ERRORS.get(bodyParserErrorType);
  if (bodyParserError !== undefined) return bodyParserError();

  // Express throws URIError when a route parameter is not valid percent-encoding.
  if (error instanceof URIError) return AppError.badRequest('The request URL is not correctly encoded.');

  if (isUniqueViolation(error)) {
    return AppError.conflict('The request conflicts with an existing resource.');
  }
  if (isDatabaseUnavailable(error)) {
    return AppError.serviceUnavailable(
      'The database is temporarily unavailable. Please try again shortly.',
      error,
    );
  }
  return AppError.internal(error);
}
