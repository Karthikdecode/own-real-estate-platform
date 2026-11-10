/**
 * Names of the HttpOnly cookies set by the API. They are part of the HTTP contract because the
 * Next.js server reads the access-token cookie to authenticate server-rendered API calls.
 * Prefixed to avoid collisions with other apps on a shared `localhost` cookie jar.
 */
export const AUTH_COOKIE_NAMES = {
  accessToken: 'realestate_access_token',
  refreshToken: 'realestate_refresh_token',
} as const;

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
} as const;
