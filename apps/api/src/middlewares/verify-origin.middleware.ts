import type { RequestHandler } from 'express';
import { UNSAFE_HTTP_METHODS } from '../common/constants/http.js';
import { AppError } from '../common/errors/app-error.js';

/**
 * CSRF defence in depth. Auth cookies are SameSite=Lax, which stops cross-site requests but not
 * same-site ones from another origin (e.g. another localhost port). State-changing requests that
 * carry an Origin header must therefore come from an allowed origin. Requests without Origin
 * (server-to-server, curl, native apps) are not browser-driven and pass.
 */
export function createVerifyOrigin(allowedOrigins: Iterable<string>): RequestHandler {
  const allowed: ReadonlySet<string> = new Set(allowedOrigins);

  return (req, _res, next) => {
    const origin = req.get('origin');
    if (
      !UNSAFE_HTTP_METHODS.has(req.method) ||
      origin === undefined ||
      allowed.has(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      next();
      return;
    }
    next(AppError.forbiddenOrigin());
  };
}
