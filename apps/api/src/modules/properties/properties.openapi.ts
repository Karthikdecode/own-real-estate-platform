import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  createPropertyRequestSchema,
  ownerPropertySummarySchema,
  propertyDetailSchema,
  propertySearchQuerySchema,
  propertySummarySchema,
  updatePropertyRequestSchema,
  updatePropertyStatusRequestSchema,
} from '@real-estate/contracts';
import { z } from 'zod';
import {
  AUTHENTICATED_SECURITY,
  apiPath,
  errorResponses,
  noContentResponse,
  paginatedResponse,
  successResponse,
} from '../../docs/openapi-responses.js';

export function registerPropertiesOpenApi(registry: OpenAPIRegistry): void {
  // Search properties
  registry.registerPath({
    method: 'get',
    path: apiPath('/properties'),
    tags: ['Properties'],
    operationId: 'searchProperties',
    summary: 'Search and filter properties',
    description:
      'Search published properties by city, locality, budget, BHK and property type. Uses keyset pagination for 50,000+ records scalability.',
    request: {
      query: propertySearchQuerySchema,
    },
    responses: {
      200: paginatedResponse('Properties matching search criteria.', propertySummarySchema),
      ...errorResponses(400),
    },
  });

  // Get property by slug
  registry.registerPath({
    method: 'get',
    path: apiPath('/properties/{slug}'),
    tags: ['Properties'],
    operationId: 'getPropertyBySlug',
    summary: 'Get public property details by slug',
    description: 'Retrieves full property specifications, photo gallery and owner details for SEO-friendly pages.',
    request: {
      params: z.object({ slug: z.string() }),
    },
    responses: {
      200: successResponse('Property detail retrieved.', propertyDetailSchema),
      ...errorResponses(404),
    },
  });

  // Similar properties
  registry.registerPath({
    method: 'get',
    path: apiPath('/properties/{propertyId}/similar'),
    tags: ['Properties'],
    operationId: 'getSimilarProperties',
    summary: 'Get similar property recommendations',
    description:
      'Recommends properties matching city, listing type, property type, and a ±30% budget range.',
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
      query: z.object({ limit: z.coerce.number().int().min(1).max(20).optional() }),
    },
    responses: {
      200: successResponse('Similar properties list.', z.array(propertySummarySchema)),
      ...errorResponses(400, 404),
    },
  });

  // Create property
  registry.registerPath({
    method: 'post',
    path: apiPath('/properties'),
    tags: ['Properties'],
    operationId: 'createProperty',
    summary: 'Create a new property listing',
    description: 'Creates a draft or published property owned by the signed-in user.',
    security: AUTHENTICATED_SECURITY,
    request: {
      body: {
        content: { 'application/json': { schema: createPropertyRequestSchema } },
      },
    },
    responses: {
      201: successResponse('Property created successfully.', propertyDetailSchema),
      ...errorResponses(400, 401, 429),
    },
  });

  // Owner listings
  registry.registerPath({
    method: 'get',
    path: apiPath('/properties/my-listings'),
    tags: ['Properties'],
    operationId: 'getMyListings',
    summary: 'Get listings owned by signed-in user',
    description: 'Owner dashboard endpoint returning all listings created by the authenticated owner.',
    security: AUTHENTICATED_SECURITY,
    responses: {
      200: paginatedResponse('Owner property listings.', ownerPropertySummarySchema),
      ...errorResponses(401),
    },
  });

  // Update property
  registry.registerPath({
    method: 'patch',
    path: apiPath('/properties/{propertyId}'),
    tags: ['Properties'],
    operationId: 'updateProperty',
    summary: 'Update an existing listing',
    description: 'Modifies property fields. Only the verified listing owner is authorized.',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: updatePropertyRequestSchema } },
      },
    },
    responses: {
      200: successResponse('Property updated successfully.', propertyDetailSchema),
      ...errorResponses(400, 401, 403, 404),
    },
  });

  // Update property status
  registry.registerPath({
    method: 'patch',
    path: apiPath('/properties/{propertyId}/status'),
    tags: ['Properties'],
    operationId: 'updatePropertyStatus',
    summary: 'Change property status (publish or archive)',
    description: 'Updates listing lifecycle status. Only the listing owner is authorized.',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: updatePropertyStatusRequestSchema } },
      },
    },
    responses: {
      200: successResponse('Property status updated.', propertyDetailSchema),
      ...errorResponses(400, 401, 403, 404),
    },
  });

  // Delete property
  registry.registerPath({
    method: 'delete',
    path: apiPath('/properties/{propertyId}'),
    tags: ['Properties'],
    operationId: 'deleteProperty',
    summary: 'Delete a property listing',
    description: 'Permanently deletes listing and its associated images.',
    security: AUTHENTICATED_SECURITY,
    request: {
      params: z.object({ propertyId: z.string().uuid() }),
    },
    responses: {
      204: noContentResponse('Property deleted successfully.'),
      ...errorResponses(401, 403, 404),
    },
  });
}

