import type { ResponseConfig, RouteConfig } from '@asteasolutions/zod-to-openapi';
import {
  apiPaginatedResponseSchema,
  apiSuccessResponseSchema,
  type ApiErrorResponse,
} from '@real-estate/contracts';
import type { z } from 'zod';
import { REQUEST_ID_HEADER } from '../common/constants/http.js';
import { ROADMAP_PHASES } from '../common/constants/roadmap.js';
import { AppError } from '../common/errors/app-error.js';
import { env } from '../config/env.js';
import { apiErrorResponseComponent, cursorPaginationMetaComponent } from './openapi-components.js';

/** Either credential is accepted: the bearer header or the HttpOnly access-token cookie. */
export const AUTHENTICATED_SECURITY: NonNullable<RouteConfig['security']> = [
  { bearerAuth: [] },
  { cookieAuth: [] },
];

/** Documented paths include the versioned base path, e.g. apiPath('/health') -> /api/v1/health. */
export function apiPath(path: `/${string}`): string {
  return `${env.API_BASE_PATH}${path}`;
}

type ResponseHeaders = NonNullable<ResponseConfig['headers']>;

const REQUEST_ID_RESPONSE_HEADER = {
  [REQUEST_ID_HEADER]: {
    description: 'Correlation id of the request (echoes a valid incoming X-Request-Id).',
    schema: { type: 'string' },
  },
} satisfies ResponseHeaders;

const RATE_LIMIT_RESPONSE_HEADERS = {
  ...REQUEST_ID_RESPONSE_HEADER,
  'Retry-After': { description: 'Seconds until the window resets.', schema: { type: 'integer' } },
  RateLimit: { description: 'IETF draft-8 remaining quota.', schema: { type: 'string' } },
  'RateLimit-Policy': { description: 'IETF draft-8 quota policy.', schema: { type: 'string' } },
} satisfies ResponseHeaders;

export function successResponse(description: string, dataSchema: z.ZodType): ResponseConfig {
  return {
    description,
    headers: REQUEST_ID_RESPONSE_HEADER,
    content: { 'application/json': { schema: apiSuccessResponseSchema(dataSchema) } },
  };
}

export function paginatedResponse(description: string, itemSchema: z.ZodType): ResponseConfig {
  const schema = apiPaginatedResponseSchema(itemSchema).extend({
    pagination: cursorPaginationMetaComponent,
  });
  return {
    description,
    headers: REQUEST_ID_RESPONSE_HEADER,
    content: { 'application/json': { schema } },
  };
}

export function noContentResponse(description: string): ResponseConfig {
  return { description, headers: REQUEST_ID_RESPONSE_HEADER };
}

export type DocumentedErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 501 | 503;

interface ErrorResponseDoc {
  readonly description: string;
  /** Built from the real AppError factories, so documented messages never drift from the code. */
  readonly example: AppError;
}

const ERROR_RESPONSE_DOCS: Record<DocumentedErrorStatus | 500, ErrorResponseDoc> = {
  400: {
    description:
      'Invalid input (VALIDATION_ERROR, with one entry per problem in `errors`), malformed JSON ' +
      '(INVALID_JSON) or an otherwise bad request (BAD_REQUEST).',
    example: AppError.validation([
      { path: 'query.minPrice', message: 'Too small: expected number to be >=0', code: 'too_small' },
    ]),
  },
  401: {
    description: 'Missing (UNAUTHENTICATED), invalid (INVALID_TOKEN) or expired (TOKEN_EXPIRED) access token.',
    example: AppError.unauthenticated(),
  },
  403: {
    description:
      'Authenticated but not allowed (FORBIDDEN), or a state-changing request from a disallowed ' +
      'browser origin (FORBIDDEN_ORIGIN).',
    example: AppError.forbidden(),
  },
  404: { description: 'The resource does not exist (NOT_FOUND).', example: AppError.notFound('Property') },
  409: {
    description: 'The request conflicts with existing data (CONFLICT).',
    example: AppError.conflict('The request conflicts with an existing resource.'),
  },
  413: { description: 'The JSON body exceeds 100kb (PAYLOAD_TOO_LARGE).', example: AppError.payloadTooLarge() },
  415: {
    description: 'Unsupported body encoding or charset (UNSUPPORTED_MEDIA_TYPE).',
    example: AppError.unsupportedMediaType('Unsupported charset; send UTF-8.'),
  },
  429: { description: 'Rate limit exceeded (RATE_LIMITED).', example: AppError.rateLimited() },
  500: { description: 'Unexpected server error (INTERNAL_ERROR).', example: AppError.internal() },
  501: {
    description: 'Planned for a later roadmap phase (NOT_IMPLEMENTED).',
    example: AppError.notImplemented('Property search', ROADMAP_PHASES.searchAndFiltering),
  },
  503: {
    description: 'A dependency such as the database is unavailable (SERVICE_UNAVAILABLE).',
    example: AppError.serviceUnavailable(
      'The database is temporarily unavailable. Please try again shortly.',
    ),
  },
};

const EXAMPLE_REQUEST_ID = '6f1c2b9e-3d4a-4f5b-8c7d-9e0f1a2b3c4d';

function toErrorResponse(status: DocumentedErrorStatus | 500): ResponseConfig {
  const { description, example } = ERROR_RESPONSE_DOCS[status];
  const body: ApiErrorResponse = {
    success: false,
    message: example.message,
    code: example.code,
    errors: [...example.details],
    requestId: EXAMPLE_REQUEST_ID,
  };
  return {
    description,
    headers: status === 429 ? RATE_LIMIT_RESPONSE_HEADERS : REQUEST_ID_RESPONSE_HEADER,
    content: { 'application/json': { schema: apiErrorResponseComponent, example: body } },
  };
}

/** Standard error responses of an operation; 500 is always included. */
export function errorResponses(...statuses: DocumentedErrorStatus[]): Record<string, ResponseConfig> {
  const documented = new Set<DocumentedErrorStatus | 500>([...statuses, 500]);
  return Object.fromEntries([...documented].map((status) => [String(status), toErrorResponse(status)]));
}
