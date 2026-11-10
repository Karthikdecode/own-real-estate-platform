import { env } from '../../config/env.js';

export { AUTH_COOKIE_NAMES } from '@real-estate/contracts';

export const JWT_ISSUER = 'real-estate-api';
export const JWT_AUDIENCE = 'real-estate-web';
export const JWT_ALGORITHM = 'HS256';

/** The refresh-token cookie is only sent to the auth endpoints, never to the rest of the API. */
export const REFRESH_TOKEN_COOKIE_PATH = `${env.API_BASE_PATH}/auth`;
