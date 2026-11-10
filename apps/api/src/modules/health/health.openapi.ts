import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { healthStatusSchema } from '@real-estate/contracts';
import { apiPath, errorResponses, successResponse } from '../../docs/openapi-responses.js';
import { HEALTH_PATH } from './health.routes.js';

export function registerHealthOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: apiPath(HEALTH_PATH),
    tags: ['Health'],
    operationId: 'getHealth',
    summary: 'Check API and database health',
    description:
      'Runs `SELECT 1` against PostgreSQL. Answers 200 when the database responds and 503 ' +
      'otherwise, so orchestrators and load balancers can use it as a readiness probe.',
    responses: {
      200: successResponse('The API and its database are healthy.', healthStatusSchema),
      ...errorResponses(503),
    },
  });
}
