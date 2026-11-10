import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  createInquiryRequestSchema,
  inquirySchema,
  receivedInquiriesQuerySchema,
  receivedInquirySchema,
  updateInquiryStatusRequestSchema,
} from '@real-estate/contracts';
import { z } from 'zod';
import {
  AUTHENTICATED_SECURITY,
  apiPath,
  errorResponses,
  paginatedResponse,
  successResponse,
} from '../../docs/openapi-responses.js';

export function registerInquiriesOpenApi(registry: OpenAPIRegistry): void {
  // Send inquiry on property
  registry.registerPath({
    method: 'post',
    path: apiPath('/properties/{propertyId}/inquiries'),
    tags: ['Inquiries'],
    operationId: 'createInquiry',
    summary: 'Send an inquiry to the property owner',
    description:
      'Contacts property owner. Protected against spam via IP & user rate limiters and duplicate active inquiry prevention.',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: createInquiryRequestSchema } },
      },
    },
    responses: {
      201: successResponse('Inquiry sent successfully.', inquirySchema),
      ...errorResponses(400, 401, 404, 409, 429),
    },
  });

  // Owner inbox: view received inquiries
  registry.registerPath({
    method: 'get',
    path: apiPath('/inquiries/my'),
    tags: ['Inquiries'],
    operationId: 'getReceivedInquiries',
    summary: 'View inquiries received on owner listings',
    description: 'Retrieves leads received by the signed-in owner with sender contact details.',
    security: AUTHENTICATED_SECURITY,
    request: {
      query: receivedInquiriesQuerySchema,
    },
    responses: {
      200: paginatedResponse('Inquiries list.', receivedInquirySchema),
      ...errorResponses(401),
    },
  });

  // Owner inbox: update inquiry status
  registry.registerPath({
    method: 'patch',
    path: apiPath('/inquiries/{inquiryId}/status'),
    tags: ['Inquiries'],
    operationId: 'updateInquiryStatus',
    summary: 'Update lead inquiry status',
    description: 'Updates status of inquiry (e.g. from new to contacted or closed).',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ inquiryId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: updateInquiryStatusRequestSchema } },
      },
    },
    responses: {
      200: successResponse('Inquiry status updated.', receivedInquirySchema),
      ...errorResponses(400, 401, 403, 404),
    },
  });
}

