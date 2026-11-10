import { userRoleSchema, uuidSchema } from '@real-estate/contracts';
import { errors, jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { JWT_ALGORITHM, JWT_AUDIENCE, JWT_ISSUER } from './auth.constants.js';
import type {
  AuthenticatedUser,
  SignAccessTokenOptions,
  SignedAccessToken,
} from './auth.types.js';

const secretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

const accessTokenClaimsSchema = z.object({
  sub: uuidSchema,
  role: userRoleSchema,
});

export async function signAccessToken(
  user: AuthenticatedUser,
  options: SignAccessTokenOptions = {},
): Promise<SignedAccessToken> {
  const issuedAt = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const expiresAt = issuedAt + env.ACCESS_TOKEN_TTL_SECONDS;

  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: 'JWT' })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secretKey);

  return { token, expiresAt: new Date(expiresAt * 1000) };
}

/** Verifies signature (HS256 only), issuer, audience and expiry, then validates the claims. */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      typ: 'JWT',
      requiredClaims: ['exp', 'iat'],
    }));
  } catch (error) {
    throw error instanceof errors.JWTExpired ? AppError.tokenExpired() : AppError.invalidToken();
  }

  const claims = accessTokenClaimsSchema.safeParse(payload);
  if (!claims.success) throw AppError.invalidToken();
  return { id: claims.data.sub, role: claims.data.role };
}
