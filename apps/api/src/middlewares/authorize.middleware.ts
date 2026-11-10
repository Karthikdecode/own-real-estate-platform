import type { RequestHandler } from 'express';
import type { UserRole } from '@real-estate/contracts';
import { AppError } from '../common/errors/app-error.js';
import { getAuthenticatedUser } from './authenticate.middleware.js';

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    const user = getAuthenticatedUser(req);
    if (!allowedRoles.includes(user.role)) {
      throw AppError.forbidden('You do not have administrative privileges to access this resource.');
    }
    next();
  };
}
