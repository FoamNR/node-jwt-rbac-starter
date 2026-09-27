import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/app-error';
import { AuthUserPayload } from '../types/express';

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (payload: AuthUserPayload): string => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      tokenId: payload.tokenId,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyAccessToken = (token: string): AuthUserPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired', { code: 'TOKEN_EXPIRED' });
    }
    throw new UnauthorizedError('Invalid access token', { code: 'INVALID_TOKEN' });
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token has expired', { code: 'REFRESH_TOKEN_EXPIRED' });
    }
    throw new UnauthorizedError('Invalid refresh token', { code: 'INVALID_REFRESH_TOKEN' });
  }
};

export const getCookieOptions = (isRefresh = false): CookieOptions => {
  // 15 mins for access token, 7 days for refresh token by default
  const maxAge = isRefresh
    ? 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    : 15 * 60 * 1000; // 15 mins in ms

  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    maxAge,
    path: '/',
  };
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie('access_token', accessToken, getCookieOptions(false));
  res.cookie('refresh_token', refreshToken, getCookieOptions(true));
};

export const clearAuthCookies = (res: Response): void => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: '/',
  };

  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
};
