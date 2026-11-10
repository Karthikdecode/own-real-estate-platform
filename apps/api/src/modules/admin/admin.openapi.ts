import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  adminDashboardStatsSchema,
  adminPropertiesQuerySchema,
  adminPropertyItemSchema,
  apiPaginatedResponseSchema,
  moderatePropertyRequestSchema,
} from '@real-estate/contracts';
import { z } from 'zod';
import {
  AUTHENTICATED_SECURITY,
  apiPath,
  errorResponses,
  paginatedResponse,
  successResponse,
} from '../../docs/openapi-responses.js';

export function registerAdminOpenApi(registry: OpenAPIRegistry): void {
  // 1. GET /admin/dashboard
  registry.registerPath({
    method: 'get',
    path: apiPath('/admin/dashboard'),
    tags: ['Admin'],
    operationId: 'getAdminDashboardStats',
    summary: 'Get platform-wide admin KPI statistics',
    security: AUTHENTICATED_SECURITY,
    responses: {
      200: successResponse('Admin dashboard statistics retrieved.', adminDashboardStatsSchema),
      ...errorResponses(401, 403),
    },
  });

  // 2. GET /admin/properties
  registry.registerPath({
    method: 'get',
    path: apiPath('/admin/properties'),
    tags: ['Admin'],
    operationId: 'getAdminProperties',
    summary: 'Search and filter all properties across all statuses for moderation',
    security: AUTHENTICATED_SECURITY,
    request: {
      query: adminPropertiesQuerySchema,
    },
    responses: {
      200: paginatedResponse(
        'Admin properties retrieved.',
        apiPaginatedResponseSchema(adminPropertyItemSchema),
      ),
      ...errorResponses(400, 401, 403),
    },
  });

  // 3. GET /admin/properties/{propertyId}
  registry.registerPath({
    method: 'get',
    path: apiPath('/admin/properties/{propertyId}'),
    tags: ['Admin'],
    operationId: 'getAdminPropertyById',
    summary: 'Get full property review details including status history',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
    },
    responses: {
      200: successResponse('Property review details retrieved.', z.record(z.string(), z.any())),
      ...errorResponses(401, 403, 404),
    },
  });

  // 4. PATCH /admin/properties/{propertyId}/moderate
  registry.registerPath({
    method: 'patch',
    path: apiPath('/admin/properties/{propertyId}/moderate'),
    tags: ['Admin'],
    operationId: 'moderateProperty',
    summary: 'Approve, reject, or request changes on a property listing',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: moderatePropertyRequestSchema,
          },
        },
      },
    },
    responses: {
      200: successResponse('Property successfully moderated.', z.record(z.string(), z.any())),
      ...errorResponses(400, 401, 403, 404),
    },
  });
}
