import {
  adminPropertiesQuerySchema,
  moderatePropertyRequestSchema,
} from '@real-estate/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { requireRole } from '../../middlewares/authorize.middleware.js';
import { createRequestValidator } from '../../middlewares/validate.middleware.js';
import type { AdminController } from './admin.controller.js';

export function createAdminRouter(controller: AdminController): Router {
  const router = Router();

  const propertiesQueryValidator = createRequestValidator(
    z.object({
      query: adminPropertiesQuerySchema,
    }),
  );

  const moderateValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
      body: moderatePropertyRequestSchema,
    }),
  );

  const propertyIdParamValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
    }),
  );

  // Apply authentication & admin/moderator role guard
  router.use(authenticate, requireRole('admin', 'moderator'));

  router.get('/admin/dashboard', controller.getDashboardStats);
  router.get('/admin/properties', propertiesQueryValidator.middleware, controller.getProperties);
  router.get(
    '/admin/properties/:propertyId',
    propertyIdParamValidator.middleware,
    controller.getPropertyById,
  );
  router.patch(
    '/admin/properties/:propertyId/moderate',
    moderateValidator.middleware,
    controller.moderateProperty,
  );

  return router;
}

