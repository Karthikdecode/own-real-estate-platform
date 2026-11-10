import type { RequestHandler } from 'express';
import { AppError } from '../common/errors/app-error.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.routeNotFound(req.method, req.path));
};
