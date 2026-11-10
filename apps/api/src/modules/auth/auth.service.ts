import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@real-estate/contracts';
import type { Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { UserEntity } from '../../database/entities/user.entity.js';
import { signAccessToken } from './access-token.js';
import { hashPassword, verifyPassword } from './password.js';
import type { RefreshTokenService } from './refresh-token.service.js';

export interface AuthResult {
  readonly user: AuthUser;
  readonly session: AuthSession;
  readonly rawAccessToken: string;
  readonly rawRefreshToken: string;
}

export class AuthService {
  constructor(
    private readonly userRepo: Repository<UserEntity>,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(input: RegisterRequest): Promise<AuthResult> {
    const existingEmail = await this.userRepo.findOneBy({ email: input.email.toLowerCase() });
    if (existingEmail) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    if (input.mobileNumber) {
      const existingPhone = await this.userRepo.findOneBy({ mobileNumber: input.mobileNumber });
      if (existingPhone) {
        throw AppError.conflict('An account with this mobile number already exists.');
      }
    }

    const passwordHash = hashPassword(input.password);
    const user = this.userRepo.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      mobileNumber: input.mobileNumber ?? null,
      passwordHash,
      role: 'user',
    });
    await this.userRepo.save(user);

    return this.createAuthResult(user);
  }

  async login(input: LoginRequest): Promise<AuthResult> {
    const user = await this.userRepo.findOneBy({ email: input.email.toLowerCase() });
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw AppError.unauthenticated('Invalid email or password.');
    }

    return this.createAuthResult(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const { user, newToken } = await this.refreshTokenService.rotateToken(rawRefreshToken);
    const { token: accessToken, expiresAt: accessExpiresAt } = await signAccessToken({
      id: user.id,
      role: user.role,
    });

    const authUser: AuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const session: AuthSession = {
      user: authUser,
      accessTokenExpiresAt: accessExpiresAt.toISOString(),
    };

    return {
      user: authUser,
      session,
      rawAccessToken: accessToken,
      rawRefreshToken: newToken.rawToken,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenService.revokeToken(rawRefreshToken);
    }
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw AppError.notFound('User');
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  private async createAuthResult(user: UserEntity): Promise<AuthResult> {
    const refreshToken = await this.refreshTokenService.issueToken(user.id);
    const { token: accessToken, expiresAt: accessExpiresAt } = await signAccessToken({
      id: user.id,
      role: user.role,
    });

    const authUser: AuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const session: AuthSession = {
      user: authUser,
      accessTokenExpiresAt: accessExpiresAt.toISOString(),
    };

    return {
      user: authUser,
      session,
      rawAccessToken: accessToken,
      rawRefreshToken: refreshToken.rawToken,
    };
  }
}
