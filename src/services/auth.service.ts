import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/app-error';
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';
import {
  comparePassword,
  generateRandomToken,
  hashPassword,
  hashToken,
} from '../utils/hash.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.util';
import { emailService } from './email.service';

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
    isEmailVerified: boolean;
    createdAt: Date;
  };
  tokens: AuthTokens;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResult['user']> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Send welcome email in background
    emailService.sendWelcomeEmail(user.email, user.firstName || undefined).catch(() => {});

    return user;
  }

  /**
   * Login user with Email & Password
   */
  async login(data: LoginInput, meta: SessionMeta): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 1. Generate Access Token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 2. Create Refresh Token record in Database
    const rawRefreshTokenString = generateRandomToken(40);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: hashToken(rawRefreshTokenString),
        userId: user.id,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    // 3. Generate Signed JWT Refresh Token
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenRecord.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Refresh Access & Refresh Tokens (with Token Rotation & Revocation)
   */
  async refreshTokens(refreshTokenStr: string, meta: SessionMeta): Promise<AuthTokens> {
    // 1. Verify Refresh Token JWT signature
    const payload = verifyRefreshToken(refreshTokenStr);

    // 2. Lookup the RefreshToken record in DB
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token was previously revoked (Reuse detection)
    if (tokenRecord.isRevoked) {
      // Security breach detected: Revoke all tokens for this user!
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedError('Token reuse detected. All active sessions have been revoked.');
    }

    // Check if expired
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // Check if user is still active
    if (!tokenRecord.user.isActive) {
      throw new ForbiddenError('User account is deactivated.');
    }

    // 3. Rotate Refresh Token: Revoke old token & Create new token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const newRawToken = generateRandomToken(40);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: hashToken(newRawToken),
        userId: tokenRecord.user.id,
        userAgent: meta.userAgent || tokenRecord.userAgent,
        ipAddress: meta.ipAddress || tokenRecord.ipAddress,
        expiresAt: newExpiresAt,
      },
    });

    // 4. Generate new tokens
    const newAccessToken = generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: tokenRecord.user.id,
      tokenId: newRefreshTokenRecord.id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout single session
   */
  async logout(refreshTokenStr?: string): Promise<void> {
    if (!refreshTokenStr) return;

    try {
      const payload = verifyRefreshToken(refreshTokenStr);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId },
        data: { isRevoked: true },
      });
    } catch {
      // Ignore token verification errors during logout
    }
  }

  /**
   * Logout from all devices (Revoke all active sessions)
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Request Password Reset
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // To prevent account enumeration attacks, don't throw an error if user is not found
    if (!user || !user.isActive) {
      return;
    }

    // Invalidate any previous unused reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate secure random token
    const rawResetToken = generateRandomToken(32);
    const hashedResetToken = hashToken(rawResetToken);

    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: hashedResetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email with raw token
    await emailService.sendPasswordResetEmail(user.email, rawResetToken, user.firstName || undefined);
  }

  /**
   * Reset Password with valid token
   */
  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const hashedToken = hashToken(data.token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.isUsed || new Date() > resetRecord.expiresAt) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const hashedPassword = await hashPassword(data.newPassword);

    // Update password, mark token used, and revoke all active refresh tokens in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);
  }
}

export const authService = new AuthService();
