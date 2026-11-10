import './zod-openapi.js';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { apiErrorResponseSchema, cursorPaginationMetaSchema } from '@real-estate/contracts';
import { SECURITY_SCHEMES } from '../config/swagger.config.js';

/** Shared schemas, emitted once under components and referenced with $ref by operations. */
export const apiErrorResponseComponent = apiErrorResponseSchema.openapi('ApiErrorResponse');
export const cursorPaginationMetaComponent =
  cursorPaginationMetaSchema.openapi('CursorPaginationMeta');

export function registerSharedComponents(registry: OpenAPIRegistry): void {
  registry.register('ApiErrorResponse', apiErrorResponseComponent);
  registry.register('CursorPaginationMeta', cursorPaginationMetaComponent);
  for (const [name, scheme] of Object.entries(SECURITY_SCHEMES)) {
    registry.registerComponent('securitySchemes', name, scheme);
  }
}
