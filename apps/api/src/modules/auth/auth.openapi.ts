import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  authSessionSchema,
  authUserSchema,
  loginRequestSchema,
  registerRequestSchema,
} from '@real-estate/contracts';
import {
  AUTHENTICATED_SECURITY,
  apiPath,
  errorResponses,
  noContentResponse,
  successResponse,
} from '../../docs/openapi-responses.js';

export function registerAuthOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: apiPath('/auth/register'),
    tags: ['Auth'],
    operationId: 'register',
    summary: 'Register a new user account',
    description: 'Creates a user record, issues JWT access and refresh tokens, and signs the user in.',
    request: {
      body: {
        content: { 'application/json': { schema: registerRequestSchema } },
      },
    },
    responses: {
      201: successResponse('Account created successfully.', authSessionSchema),
      ...errorResponses(400, 409),
    },
  });

  registry.registerPath({
    method: 'post',
    path: apiPath('/auth/login'),
    tags: ['Auth'],
    operationId: 'login',
    summary: 'Log in with email and password',
    description: 'Validates user credentials and issues a new session with JWT tokens.',
    request: {
      body: {
        content: { 'application/json': { schema: loginRequestSchema } },
      },
    },
    responses: {
      200: successResponse('Logged in successfully.', authSessionSchema),
      ...errorResponses(400, 401),
    },
  });

  registry.registerPath({
    method: 'post',
    path: apiPath('/auth/refresh'),
    tags: ['Auth'],
    operationId: 'refreshSession',
    summary: 'Rotate refresh token and issue new access token',
    description: 'Rotates the refresh token (with token-family reuse detection) and returns fresh tokens.',
    responses: {
      200: successResponse('Session refreshed.', authSessionSchema),
      ...errorResponses(401),
    },
  });

  registry.registerPath({
    method: 'post',
    path: apiPath('/auth/logout'),
    tags: ['Auth'],
    operationId: 'logout',
    summary: 'Log out and revoke session',
    description: 'Revokes the current refresh token and clears auth cookies.',
    security: AUTHENTICATED_SECURITY,
    responses: {
      204: noContentResponse('Logged out.'),
      ...errorResponses(401),
    },
  });

  registry.registerPath({
    method: 'get',
    path: apiPath('/auth/me'),
    tags: ['Auth'],
    operationId: 'getMe',
    summary: 'Get current signed-in user profile',
    description: 'Returns profile information for the authenticated user.',
    security: AUTHENTICATED_SECURITY,
    responses: {
      200: successResponse('Profile retrieved.', authUserSchema),
      ...errorResponses(401),
    },
  });
}

