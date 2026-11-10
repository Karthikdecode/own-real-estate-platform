import type { AuthenticatedUser } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      /** Correlation id; also returned in the X-Request-Id header and error envelopes. */
      requestId: string;
      /** Set by the authenticate middleware. */
      user?: AuthenticatedUser;
    }
  }
}

export {};
