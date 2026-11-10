import {
  createPropertyRequestSchema,
  myListingsQuerySchema,
  propertySearchQuerySchema,
  similarPropertiesQuerySchema,
  updatePropertyRequestSchema,
  updatePropertyStatusRequestSchema,
} from '@real-estate/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { createWriteRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { createRequestValidator } from '../../middlewares/validate.middleware.js';
import type { PropertiesController } from './properties.controller.js';

export function createPropertiesRouter(controller: PropertiesController): Router {
  const router = Router();
  const writeLimiter = createWriteRateLimiter();

  const searchQueryValidator = createRequestValidator(
    z.object({
      query: propertySearchQuerySchema,
    }),
  );

  const createValidator = createRequestValidator(
    z.object({
      body: createPropertyRequestSchema,
    }),
  );

  const updateValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
      body: updatePropertyRequestSchema,
    }),
  );

  const updateStatusValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
      body: updatePropertyStatusRequestSchema,
    }),
  );

  const slugValidator = createRequestValidator(
    z.object({
      params: z.object({ slug: z.string().min(1) }),
    }),
  );

  const similarValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
      query: similarPropertiesQuerySchema,
    }),
  );

  const myListingsValidator = createRequestValidator(
    z.object({
      query: myListingsQuerySchema,
    }),
  );

  // Search & listings
  router.get('/properties', searchQueryValidator.middleware, controller.search);
  router.get(
    '/properties/my-listings',
    authenticate,
    myListingsValidator.middleware,
    controller.getMyListings,
  );
  router.get(
    '/properties/my-listings/:propertyId',
    authenticate,
    controller.getMyListingById,
  );

  // Mutations
  router.post('/properties', authenticate, writeLimiter, createValidator.middleware, controller.create);
  router.patch(
    '/properties/:propertyId',
    authenticate,
    writeLimiter,
    updateValidator.middleware,
    controller.update,
  );
  router.patch(
    '/properties/:propertyId/status',
    authenticate,
    writeLimiter,
    updateStatusValidator.middleware,
    controller.updateStatus,
  );
  router.delete('/properties/:propertyId', authenticate, writeLimiter, controller.delete);

  // Details and Similar
  router.get('/properties/:slug', slugValidator.middleware, controller.getBySlug);
  router.get(
    '/properties/:propertyId/similar',
    similarValidator.middleware,
    controller.getSimilar,
  );

  return router;
}

