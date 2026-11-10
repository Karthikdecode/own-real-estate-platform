import {
  loginRequestSchema,
  registerRequestSchema,
} from '@real-estate/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import {
  createAuthRateLimiter,
  createRefreshRateLimiter,
} from '../../middlewares/rate-limit.middleware.js';
import { createRequestValidator } from '../../middlewares/validate.middleware.js';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  const authLimiter = createAuthRateLimiter();
  const refreshLimiter = createRefreshRateLimiter();

  const registerValidator = createRequestValidator(
    z.object({
      body: registerRequestSchema,
    }),
  );

  const loginValidator = createRequestValidator(
    z.object({
      body: loginRequestSchema,
    }),
  );

  router.post('/auth/register', authLimiter, registerValidator.middleware, controller.register);
  router.post('/auth/login', authLimiter, loginValidator.middleware, controller.login);
  router.post('/auth/refresh', refreshLimiter, controller.refresh);
  router.post('/auth/logout', refreshLimiter, controller.logout);
  router.get('/auth/me', authenticate, controller.getMe);

  return router;
}

