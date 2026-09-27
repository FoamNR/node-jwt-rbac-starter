import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger.util';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  // 1. Custom Application Error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // 2. Prisma Known Database Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = (err.meta?.target as string[]) || [];
      message = `Duplicate field value: ${target.join(', ')}. Please use another value.`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record not found in database.';
    } else {
      statusCode = 400;
      message = `Database Error: ${err.message}`;
    }
  }
  // 3. Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database schema validation error';
  }
  // 4. Invalid JSON Body
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body';
  } else {
    // Unexpected internal error
    logger.error('💥 Unhandled Exception:', err);
  }

  // Log non-operational errors
  if (statusCode === 500) {
    logger.error('🚨 500 Server Error:', {
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};
