import { ERROR_CODES, authSessionSchema, type AuthSession } from '@real-estate/contracts';
import { publicEnv } from '@/config/env';
import { isApiError } from './api-error';
import { createApiMethods } from './api-methods';
import { request, type CommonRequestOptions } from './http';

export interface ClientRequestOptions extends CommonRequestOptions {
  /** Browser HTTP cache mode, e.g. `no-store` for live diagnostics. */
  cache?: RequestCache;
}

let refreshInFlight: Promise<AuthSession> | null = null;

/**
 * Renews the session cookies through POST /auth/refresh. Single-flight: concurrent callers share
 * one request, because the refresh token rotates and a parallel second refresh would present a
 * token that was already spent.
 */
export function refreshSession(): Promise<AuthSession> {
  refreshInFlight ??= request(publicEnv.apiBaseUrl, '/auth/refresh', {
    method: 'POST',
    schema: authSessionSchema,
    fetchOptions: { credentials: 'include' },
  }).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** On an expired access token, refreshes the session once and retries the request once. */
async function withSessionRefresh<T>(send: () => Promise<T>): Promise<T> {
  try {
    return await send();
  } catch (error) {
    if (!isApiError(error) || error.code !== ERROR_CODES.TOKEN_EXPIRED) throw error;
  }
  await refreshSession();
  return send();
}

/**
 * API client for Client Components. Authentication rides on the API's HttpOnly cookies
 * (`credentials: 'include'`); tokens are never readable by, or stored from, JavaScript.
 */
export const apiClient = createApiMethods<ClientRequestOptions>({
  baseUrl: publicEnv.apiBaseUrl,
  toRequestOptions: (method, { cache, ...options } = {}) => ({
    ...options,
    method,
    fetchOptions: { credentials: 'include', cache },
  }),
  around: withSessionRefresh,
});
