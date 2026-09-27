import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { authService } from '../services/auth.service';
import { clearAuthCookies, setAuthCookies } from '../utils/jwt.util';
import { sendCreated, sendSuccess } from '../utils/response.util';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const user = await authService.register(req.body);
    sendCreated(res, { user }, 'User registered successfully. You can now log in.');
  }

  /**
   * Log in user
   */
  async login(req: Request, res: Response): Promise<void> {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await authService.login(req.body, meta);

    // Set HttpOnly Cookies for browser clients (Hybrid support)
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    sendSuccess(
      res,
      {
        user: result.user,
        tokens: result.tokens,
      },
      'Logged in successfully'
    );
  }

  /**
   * Refresh Access & Refresh Tokens
   */
  async refreshTokens(req: Request, res: Response): Promise<void> {
    // 1. Check refresh token in Cookie or Body
    const refreshTokenStr = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!refreshTokenStr) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const newTokens = await authService.refreshTokens(refreshTokenStr, meta);

    // Update Cookies
    setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

    sendSuccess(
      res,
      {
        tokens: newTokens,
      },
      'Tokens refreshed successfully'
    );
  }

  /**
   * Log out current session
   */
  async logout(req: Request, res: Response): Promise<void> {
    const refreshTokenStr = req.cookies?.refresh_token || req.body?.refreshToken;

    await authService.logout(refreshTokenStr);

    // Clear HttpOnly Cookies
    clearAuthCookies(res);

    sendSuccess(res, null, 'Logged out successfully');
  }

  /**
   * Log out all active sessions/devices
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    await authService.logoutAll(req.user.id);

    // Clear current client cookies
    clearAuthCookies(res);

    sendSuccess(res, null, 'Logged out from all devices successfully');
  }

  /**
   * Request Password Reset
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body);
    sendSuccess(
      res,
      null,
      'If an account with that email exists, a password reset link has been sent.'
    );
  }

  /**
   * Reset Password with token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    sendSuccess(res, null, 'Password reset successful. You may now log in with your new password.');
  }

  /**
   * Get Current Authenticated User profile
   */
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    sendSuccess(res, { user: req.user }, 'Current user profile fetched successfully');
  }
}

export const authController = new AuthController();
