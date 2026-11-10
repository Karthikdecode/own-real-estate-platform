import {
  createInquiryRequestSchema,
  receivedInquiriesQuerySchema,
  updateInquiryStatusRequestSchema,
} from '@real-estate/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import {
  createInquiryIpRateLimiter,
  createInquiryUserRateLimiter,
} from '../../middlewares/rate-limit.middleware.js';
import { createRequestValidator } from '../../middlewares/validate.middleware.js';
import type { InquiriesController } from './inquiries.controller.js';

export function createInquiriesRouter(controller: InquiriesController): Router {
  const router = Router();
  const inquiryIpLimiter = createInquiryIpRateLimiter();
  const inquiryUserLimiter = createInquiryUserRateLimiter();

  const createValidator = createRequestValidator(
    z.object({
      params: z.object({ propertyId: z.string().uuid() }),
      body: createInquiryRequestSchema,
    }),
  );

  const getReceivedValidator = createRequestValidator(
    z.object({
      query: receivedInquiriesQuerySchema,
    }),
  );

  const updateStatusValidator = createRequestValidator(
    z.object({
      params: z.object({ inquiryId: z.string().uuid() }),
      body: updateInquiryStatusRequestSchema,
    }),
  );

  // Send inquiry on property (protected, with IP & User rate limiting)
  router.post(
    '/properties/:propertyId/inquiries',
    inquiryIpLimiter,
    authenticate,
    inquiryUserLimiter,
    createValidator.middleware,
    controller.create,
  );

  // Owner inbox: view received inquiries
  router.get(
    '/inquiries/my',
    authenticate,
    getReceivedValidator.middleware,
    controller.getReceived,
  );

  // Customer outbox: view sent inquiries
  router.get(
    '/inquiries/sent',
    authenticate,
    getReceivedValidator.middleware,
    controller.getSent,
  );

  // Owner inbox: update inquiry status
  router.patch(
    '/inquiries/:inquiryId/status',
    authenticate,
    updateStatusValidator.middleware,
    controller.updateStatus,
  );

  return router;
}

