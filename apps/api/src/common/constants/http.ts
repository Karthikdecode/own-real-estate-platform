export const REQUEST_ID_HEADER = 'X-Request-Id';

/** State-changing methods: the CSRF origin check and write rate limits apply to these. */
export const UNSAFE_HTTP_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Public route of locally stored uploads; storage keys are appended to it. */
export const UPLOADS_ROUTE = '/uploads';
