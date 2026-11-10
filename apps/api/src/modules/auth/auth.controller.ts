import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { sendNoContent, sendSuccess } from '../../common/responses/api-response.js';
import { env } from '../../config/env.js';
import { getAuthenticatedUser } from '../../middlewares/authenticate.middleware.js';
import { readCookie } from '../../utils/cookies.js';
import { AUTH_COOKIE_NAMES, REFRESH_TOKEN_COOKIE_PATH } from './auth.constants.js';
import type { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    this.setAuthCookies(res, result.rawAccessToken, result.session.accessTokenExpiresAt, result.rawRefreshToken);
    sendSuccess(res, result.session, 'Registration successful.', 201);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    this.setAuthCookies(res, result.rawAccessToken, result.session.accessTokenExpiresAt, result.rawRefreshToken);
    sendSuccess(res, result.session, 'Login successful.');
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = readCookie(req, AUTH_COOKIE_NAMES.refreshToken) ?? req.body?.refreshToken;
    if (!rawRefreshToken) {
      throw AppError.unauthenticated('Refresh token missing.');
    }

    const result = await this.authService.refresh(rawRefreshToken);
    this.setAuthCookies(res, result.rawAccessToken, result.session.accessTokenExpiresAt, result.rawRefreshToken);
    sendSuccess(res, result.session, 'Session refreshed.');
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = readCookie(req, AUTH_COOKIE_NAMES.refreshToken) ?? req.body?.refreshToken;
    await this.authService.logout(rawRefreshToken);
    this.clearAuthCookies(res);
    sendNoContent(res);
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const profile = await this.authService.getMe(user.id);
    sendSuccess(res, profile, 'User profile fetched.');
  };

  private setAuthCookies(
    res: Response,
    accessToken: string,
    accessExpiresAtIso: string,
    refreshToken: string,
  ): void {
    const isProd = env.NODE_ENV === 'production';
    const accessExpiresAt = new Date(accessExpiresAtIso);
    const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    res.cookie(AUTH_COOKIE_NAMES.accessToken, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      expires: accessExpiresAt,
      path: '/',
    });

    res.cookie(AUTH_COOKIE_NAMES.refreshToken, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      expires: refreshExpiresAt,
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAMES.accessToken, { path: '/' });
    res.clearCookie(AUTH_COOKIE_NAMES.refreshToken, { path: REFRESH_TOKEN_COOKIE_PATH });
  }
}
