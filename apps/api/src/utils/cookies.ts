import type { Request } from 'express';

/** Reads a non-empty cookie parsed by cookie-parser without touching its untyped `req.cookies`. */
export function readCookie(req: Request, name: string): string | undefined {
  const cookies: unknown = req.cookies;
  if (typeof cookies !== 'object' || cookies === null || !Object.hasOwn(cookies, name)) {
    return undefined;
  }
  const value: unknown = Reflect.get(cookies, name);
  return typeof value === 'string' && value !== '' ? value : undefined;
}
