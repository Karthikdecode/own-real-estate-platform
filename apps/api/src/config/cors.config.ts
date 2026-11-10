import type { CorsOptions } from 'cors';
import { REQUEST_ID_HEADER } from '../common/constants/http.js';

/** Response headers browsers may read: correlation id plus the IETF draft-8 rate-limit headers. */
const EXPOSED_HEADERS = [REQUEST_ID_HEADER, 'RateLimit', 'RateLimit-Policy', 'Retry-After'];

/** Exact-match origin allowlist with credentials (auth cookies). Requests without Origin pass. */
export function createCorsOptions(allowedOrigins: readonly string[]): CorsOptions {
  return {
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: 600,
  };
}
