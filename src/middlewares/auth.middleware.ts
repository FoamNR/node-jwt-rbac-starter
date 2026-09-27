import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ROLE_HIERARCHY } from '../constants/roles';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';
import { verifyAccessToken } from '../utils/jwt.util';

/**
 * Hybrid Authentication Middleware:
 * Extracts access token from either Authorization Bearer header OR HttpOnly Cookie.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Authorization Header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Check HttpOnly Cookie fallback
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token required. Please log in.');
    }

    // 3. Verify Token
    const payload = verifyAccessToken(token);

    // 4. Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found. Please log in again.');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated. Please contact support.');
    }

    // 5. Attach user and token to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RBAC Middleware: Require specific role(s)
 */
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Permission denied. Required role: [${allowedRoles.join(', ')}]. Your role: [${req.user.role}]`
        )
      );
    }

    next();
  };
};

/**
 * RBAC Middleware: Require minimum role level in hierarchy
 */
export const requireMinRole = (minimumRole: Role) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        new ForbiddenError(
          `Permission denied. Minimum required role level: ${minimumRole}`
        )
      );
    }

    next();
  };
};
