import {
  apiErrorResponseSchema,
  apiPaginatedResponseSchema,
  apiSuccessResponseSchema,
  type CursorPaginationMeta,
} from '@real-estate/contracts';
import { z } from 'zod';
import { ApiError } from './api-error';

export const DEFAULT_TIMEOUT_MS = 10_000;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

/** Plain-object request body, sent as JSON. */
export type JsonBody = Readonly<Record<string, unknown>>;

/** Fetch settings owned by the entry points; Next.js extends RequestInit with `next`. */
export type FetchOptions = Pick<RequestInit, 'cache' | 'credentials' | 'next'>;

export interface RequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  body?: JsonBody | FormData;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchOptions?: FetchOptions;
}

/** Options callers of either entry point may pass; transport settings stay with the entry point. */
export type CommonRequestOptions = Omit<RequestOptions, 'method' | 'fetchOptions'>;

export interface Page<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}

interface ReceivedResponse {
  status: number;
  requestId: string | undefined;
  /** Parsed JSON body; undefined for 204 No Content. */
  payload: unknown;
}

interface AbortContext {
  timeoutSignal: AbortSignal;
  callerSignal: AbortSignal | undefined;
  timeoutMs: number;
}

const successEnvelopeSchema = apiSuccessResponseSchema(z.unknown());
const pageEnvelopeSchema = apiPaginatedResponseSchema(z.unknown());

/**
 * Sends a request to `baseUrl + path` and returns the `data` of the success envelope, validated
 * against `schema` when one is given. 204 responses resolve to undefined. Every failure rejects
 * with an ApiError, except a caller-initiated abort, which rejects with the signal's reason.
 */
export function request<S extends z.ZodType>(
  baseUrl: string,
  path: string,
  options: RequestOptions & { schema: S },
): Promise<z.output<S>>;
export function request(
  baseUrl: string,
  path: string,
  options?: RequestOptions & { schema?: z.ZodType },
): Promise<unknown>;
export async function request(
  baseUrl: string,
  path: string,
  options: RequestOptions & { schema?: z.ZodType } = {},
): Promise<unknown> {
  const response = await send(baseUrl, path, options);
  const data =
    response.status === 204
      ? undefined
      : conform(successEnvelopeSchema, response.payload, response).data;
  return options.schema ? conform(options.schema, data, response) : data;
}

/** Sends a request to a cursor-paginated endpoint and validates every item against `itemSchema`. */
export async function requestPage<S extends z.ZodType>(
  baseUrl: string,
  path: string,
  options: RequestOptions & { itemSchema: S },
): Promise<Page<z.output<S>>> {
  const response = await send(baseUrl, path, options);
  const envelope = conform(pageEnvelopeSchema, response.payload, response);
  return {
    items: conform(z.array(options.itemSchema), envelope.data, response),
    pagination: envelope.pagination,
  };
}

/** Builds an API path, URL-encoding every interpolated segment: apiPath`/properties/${id}`. */
export function apiPath(
  strings: TemplateStringsArray,
  ...segments: readonly (string | number)[]
): string {
  return String.raw(
    { raw: strings },
    ...segments.map((segment) => encodeURIComponent(String(segment))),
  );
}

async function send(
  baseUrl: string,
  path: string,
  options: RequestOptions,
): Promise<ReceivedResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
  const abortContext: AbortContext = { timeoutSignal, callerSignal: options.signal, timeoutMs };
  const url = buildUrl(baseUrl, path, options.query);
  const { body, contentType } = encodeBody(options.body);
  const headers = buildHeaders(options.headers, contentType);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options.fetchOptions,
      method: options.method ?? 'GET',
      headers,
      body,
      signal,
    });
  } catch (error) {
    throw toTransportFailure(error, abortContext);
  }

  const requestId = response.headers.get('x-request-id') ?? undefined;
  if (response.status === 204) return { status: 204, requestId, payload: undefined };

  const json = await readJson(response, signal, abortContext);
  if (!response.ok) {
    throw toHttpError(response.status, requestId, json.parsed ? json.value : undefined);
  }
  if (!json.parsed) {
    throw new ApiError({
      status: response.status,
      code: 'INVALID_RESPONSE',
      message: 'The API returned a response that is not valid JSON.',
      requestId,
    });
  }
  return { status: response.status, requestId, payload: json.value };
}

function buildUrl(baseUrl: string, path: string, query: QueryParams | undefined): string {
  const url = new URL(`${withoutTrailingSlash(baseUrl)}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    const serialized = serializeQueryValue(value);
    if (serialized !== undefined) url.searchParams.set(key, serialized);
  }
  return url.toString();
}

/** Arrays become comma-separated lists (the API's multi-value format); empty values are omitted. */
function serializeQueryValue(value: QueryValue): string | undefined {
  if (value === undefined || value === null) return undefined;
  const serialized = Array.isArray(value) ? value.join(',') : String(value);
  return serialized === '' ? undefined : serialized;
}

function encodeBody(body: RequestOptions['body']): { body?: BodyInit; contentType?: string } {
  if (body === undefined) return {};
  // The runtime must generate the multipart boundary, so FormData keeps its own Content-Type.
  if (body instanceof FormData) return { body };
  return { body: JSON.stringify(body), contentType: 'application/json' };
}

function buildHeaders(custom: RequestOptions['headers'], contentType: string | undefined): Headers {
  const headers = new Headers(custom);
  headers.set('Accept', 'application/json');
  if (contentType) headers.set('Content-Type', contentType);
  return headers;
}

async function readJson(
  response: Response,
  signal: AbortSignal,
  abortContext: AbortContext,
): Promise<{ parsed: true; value: unknown } | { parsed: false }> {
  try {
    const value: unknown = await response.json();
    return { parsed: true, value };
  } catch (error) {
    if (signal.aborted) throw toTransportFailure(error, abortContext);
    return { parsed: false };
  }
}

function toTransportFailure(error: unknown, context: AbortContext): unknown {
  // A caller-initiated abort is a cancellation, not an API failure, so it propagates untouched.
  if (context.callerSignal?.aborted) return context.callerSignal.reason;
  if (context.timeoutSignal.aborted) {
    return new ApiError({
      status: 0,
      code: 'TIMEOUT',
      message: `The API did not respond within ${context.timeoutMs} ms.`,
      cause: error,
    });
  }
  // fetch rejects with a TypeError for DNS, connection, TLS and CORS failures.
  if (error instanceof TypeError) {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'The API could not be reached.',
      cause: error,
    });
  }
  // Anything else, such as the control-flow errors Next.js throws from its patched fetch while
  // prerendering, must reach the framework unchanged.
  return error;
}

function toHttpError(status: number, requestId: string | undefined, payload: unknown): ApiError {
  const envelope = apiErrorResponseSchema.safeParse(payload);
  if (!envelope.success) {
    return new ApiError({
      status,
      code: 'INVALID_RESPONSE',
      message: `The API answered with HTTP ${status} without a valid error body.`,
      requestId,
    });
  }
  return new ApiError({
    status,
    code: envelope.data.code,
    message: envelope.data.message,
    details: envelope.data.errors,
    requestId: envelope.data.requestId ?? requestId,
  });
}

/** Validates a payload against the contract; a mismatch means the API broke its contract. */
function conform<S extends z.ZodType>(
  schema: S,
  value: unknown,
  response: ReceivedResponse,
): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issueMessages = result.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join(', ');
  console.error('[API Contract Mismatch]:', issueMessages, 'Received Value:', value);
  throw new ApiError({
    status: response.status,
    code: 'INVALID_RESPONSE',
    message: `The API response does not match the expected contract (${issueMessages}).`,
    details: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
      code: issue.code,
    })),
    requestId: response.requestId,
  });
}

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
