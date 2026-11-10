import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  API_DOCS_JSON_PATH,
  API_DOCS_PATH,
  openApiDocumentConfig,
  swaggerUiOptions,
} from '../config/swagger.config.js';
import { registerAdminOpenApi } from '../modules/admin/admin.openapi.js';
import { registerAuthOpenApi } from '../modules/auth/auth.openapi.js';
import { registerHealthOpenApi } from '../modules/health/health.openapi.js';
import { registerInquiriesOpenApi } from '../modules/inquiries/inquiries.openapi.js';
import { registerPropertiesOpenApi } from '../modules/properties/properties.openapi.js';
import { registerSharedComponents } from './openapi-components.js';

export type OpenApiDocument = ReturnType<OpenApiGeneratorV31['generateDocument']>;

/** Builds the OpenAPI 3.1 document from the Zod contracts; called once when the app is created. */
export function createOpenApiDocument(): OpenApiDocument {
  const registry = new OpenAPIRegistry();
  registerSharedComponents(registry);

  // Each feature module documents its own operations:
  registerHealthOpenApi(registry);
  registerAuthOpenApi(registry);
  registerPropertiesOpenApi(registry);
  registerInquiriesOpenApi(registry);
  registerAdminOpenApi(registry);

  const generator = new OpenApiGeneratorV31(registry.definitions, {
    sortComponents: 'alphabetically',
  });
  return generator.generateDocument(openApiDocumentConfig);
}

/** Swagger UI at /api-docs and the raw document at /api-docs.json. */
export function mountApiDocs(app: Express, document: OpenApiDocument): void {
  app.get(API_DOCS_JSON_PATH, (_req, res) => {
    res.json(document);
  });
  app.use(
    API_DOCS_PATH,
    swaggerUi.serveFiles(document, swaggerUiOptions),
    swaggerUi.setup(document, swaggerUiOptions),
  );
}
