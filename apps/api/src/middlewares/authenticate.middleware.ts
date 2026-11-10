import type { Request, RequestHandler } from 'express';
import { AppError } from '../common/errors/app-error.js';
import { verifyAccessToken } from '../modules/auth/access-token.js';
import { AUTH_COOKIE_NAMES } from '../modules/auth/auth.constants.js';
import type { AuthenticatedUser } from '../modules/auth/auth.types.js';
import { readCookie } from '../utils/cookies.js';

const BEARER_TOKEN_PATTERN = /^Bearer\s+(\S+)$/i;

/** Bearer header first (mobile, server-to-server), then the HttpOnly cookie (browsers). */
export function extractAccessToken(req: Request): string | undefined {
  const authorization = req.get('authorization');
  const bearerToken =
    authorization === undefined ? undefined : BEARER_TOKEN_PATTERN.exec(authorization)?.[1];
  return bearerToken ?? readCookie(req, AUTH_COOKIE_NAMES.accessToken);
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (token === undefined) throw AppError.unauthenticated();
  req.user = await verifyAccessToken(token);
  next();
};

/** For handlers behind `authenticate`; replaces non-null assertions on `req.user`. */
export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  if (req.user === undefined) throw AppError.unauthenticated();
  return req.user;
}
