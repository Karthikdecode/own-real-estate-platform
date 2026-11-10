import type { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { AUTH_COOKIE_NAMES } from '@real-estate/contracts';
import type { SwaggerUiOptions } from 'swagger-ui-express';
import { env } from './env.js';

export const API_DOCS_PATH = '/api-docs';
export const API_DOCS_JSON_PATH = '/api-docs.json';

const API_DESCRIPTION = `
REST API of the Real Estate Platform (property listings for sale and rent).

**Envelopes.** Success: \`{ success: true, message, data }\`. Lists add
\`pagination: { nextCursor, hasNextPage, limit }\` (keyset pagination: send \`nextCursor\` back as
\`cursor\`). Errors: \`{ success: false, message, code, errors[], requestId }\` with a stable \`code\`.

**Authentication.** Browsers use the HttpOnly \`${AUTH_COOKIE_NAMES.accessToken}\` cookie; other
clients send \`Authorization: Bearer <token>\`. State-changing requests with a disallowed \`Origin\`
header are rejected with 403 FORBIDDEN_ORIGIN.

**Roadmap.** Endpoints planned for later phases are routed, validated and documented already;
until implemented they answer 501 NOT_IMPLEMENTED naming the roadmap phase.

**Tracing.** Every response carries \`X-Request-Id\`; send your own to correlate logs.
`.trim();

export const openApiDocumentConfig = {
  openapi: '3.1.0',
  info: {
    title: 'Real Estate Platform API',
    version: '0.1.0',
    description: API_DESCRIPTION,
  },
  servers: [{ url: env.API_PUBLIC_URL, description: 'API origin (paths include the version)' }],
  tags: [{ name: 'Health', description: 'Liveness and dependency checks.' }],
} satisfies Parameters<OpenApiGeneratorV31['generateDocument']>[0];

export const SECURITY_SCHEMES = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Access token in the Authorization header (mobile and server-to-server clients).',
  },
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: AUTH_COOKIE_NAMES.accessToken,
    description: 'HttpOnly access-token cookie set by the auth endpoints (browser clients).',
  },
} as const;

export const swaggerUiOptions: SwaggerUiOptions = {
  customSiteTitle: 'Real Estate Platform API docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    // The validator badge would call an external service that the CSP blocks anyway.
    validatorUrl: null,
  },
};
