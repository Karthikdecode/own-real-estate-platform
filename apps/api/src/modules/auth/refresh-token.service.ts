import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { RefreshTokenEntity } from '../../database/entities/refresh-token.entity.js';
import { UserEntity } from '../../database/entities/user.entity.js';

export interface IssuedRefreshToken {
  readonly rawToken: string;
  readonly expiresAt: Date;
  readonly familyId: string;
}

export function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export class RefreshTokenService {
  constructor(
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async issueToken(userId: string, familyId: string = randomUUID()): Promise<IssuedRefreshToken> {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashRefreshToken(rawToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    const tokenEntity = this.refreshTokenRepo.create({
      userId,
      familyId,
      tokenHash,
      expiresAt,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return { rawToken, expiresAt, familyId };
  }

  async rotateToken(
    rawToken: string,
  ): Promise<{ user: UserEntity; newToken: IssuedRefreshToken }> {
    const tokenHash = hashRefreshToken(rawToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!existing) {
      throw AppError.unauthenticated('Invalid refresh token.');
    }

    // Reuse detection: If a revoked token is used, revoke the entire token family!
    if (existing.revokedAt !== null) {
      await this.refreshTokenRepo.update(
        { familyId: existing.familyId },
        { revokedAt: new Date() },
      );
      throw AppError.unauthenticated('Refresh token reuse detected. Please log in again.');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthenticated('Refresh token has expired. Please log in again.');
    }

    // Revoke current token
    existing.revokedAt = new Date();
    await this.refreshTokenRepo.save(existing);

    const user = existing.user ?? (await this.userRepo.findOneBy({ id: existing.userId }));
    if (!user) {
      throw AppError.unauthenticated('User not found.');
    }

    // Issue new token in same family
    const newToken = await this.issueToken(user.id, existing.familyId);
    return { user, newToken };
  }

  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawToken);
    await this.refreshTokenRepo.update({ tokenHash }, { revokedAt: new Date() });
  }
}

