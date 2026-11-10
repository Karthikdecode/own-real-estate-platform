import type { Request } from 'express';
import { ipKeyGenerator, rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { AppError } from '../common/errors/app-error.js';
import { logger } from '../utils/logger.js';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export interface RateLimitPolicy {
  /** Policy name advertised in the RateLimit / RateLimit-Policy headers. */
  readonly name: string;
  readonly windowMs: number;
  readonly limit: number;
  /** `user` keys by the authenticated user id (falls back to the IP when unauthenticated). */
  readonly keyBy: 'ip' | 'user';
}

/*
 * There is deliberately no global per-IP limiter on public GET endpoints: most of them are called
 * by the Next.js server, where one IP represents every visitor. Edge/proxy rate limiting covers
 * direct scraping; these policies protect credential and write endpoints.
 */
const isDev = process.env.NODE_ENV === 'development';

export const RATE_LIMIT_POLICIES = {
  auth: { name: 'auth', windowMs: 15 * MINUTE_MS, limit: isDev ? 1000 : 10, keyBy: 'ip' },
  refresh: { name: 'refresh', windowMs: 15 * MINUTE_MS, limit: isDev ? 1000 : 30, keyBy: 'ip' },
  write: { name: 'write', windowMs: MINUTE_MS, limit: isDev ? 1000 : 60, keyBy: 'user' },
  inquiryIp: { name: 'inquiry-ip', windowMs: HOUR_MS, limit: isDev ? 1000 : 20, keyBy: 'ip' },
  inquiryUser: { name: 'inquiry-user', windowMs: HOUR_MS, limit: isDev ? 1000 : 5, keyBy: 'user' },
} as const satisfies Record<string, RateLimitPolicy>;

/** IPv6 clients are grouped by subnet so rotating addresses inside one allocation does not help. */
function ipKey(req: Request): string {
  return `ip:${ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown')}`;
}

function userOrIpKey(req: Request): string {
  return req.user === undefined ? ipKey(req) : `user:${req.user.id}`;
}

/** Each call creates an independent in-memory store, so every app instance (and test) starts fresh. */
export function createRateLimiter(policy: RateLimitPolicy): RateLimitRequestHandler {
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,
    identifier: policy.name,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: policy.keyBy === 'user' ? userOrIpKey : ipKey,
    handler: (_req, _res, next) => {
      next(AppError.rateLimited());
    },
    logger: {
      error: (error, message) => {
        logger.error({ err: error }, message ?? 'Rate limiter error');
      },
      warn: (error, message) => {
        logger.warn({ err: error }, message ?? 'Rate limiter warning');
      },
    },
  });
}

/** Register and login, per IP. */
export const createAuthRateLimiter = (): RateLimitRequestHandler =>
  createRateLimiter(RATE_LIMIT_POLICIES.auth);

/** Token refresh and logout, per IP. */
export const createRefreshRateLimiter = (): RateLimitRequestHandler =>
  createRateLimiter(RATE_LIMIT_POLICIES.refresh);

/** Authenticated writes, per user; mount after `authenticate`. */
export const createWriteRateLimiter = (): RateLimitRequestHandler =>
  createRateLimiter(RATE_LIMIT_POLICIES.write);

/** Inquiry creation, per IP. */
export const createInquiryIpRateLimiter = (): RateLimitRequestHandler =>
  createRateLimiter(RATE_LIMIT_POLICIES.inquiryIp);

/** Inquiry creation, per user; mount after `authenticate`. */
export const createInquiryUserRateLimiter = (): RateLimitRequestHandler =>
  createRateLimiter(RATE_LIMIT_POLICIES.inquiryUser);
