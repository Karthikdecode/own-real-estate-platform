import type { UserRole } from '@real-estate/contracts';

/** Identity attached to `req.user` by the authenticate middleware. */
export interface AuthenticatedUser {
  readonly id: string;
  readonly role: UserRole;
}

/** Custom claims of the access-token JWT (`sub` is the user id). */
export interface AccessTokenClaims {
  readonly sub: string;
  readonly role: UserRole;
}

export interface SignedAccessToken {
  readonly token: string;
  readonly expiresAt: Date;
}

export interface SignAccessTokenOptions {
  /** Issue time; tests pass a past date to produce expired tokens. */
  readonly now?: Date;
}
