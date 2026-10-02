import type { NextFunction, Request, Response } from 'express';

import {
  BadRequestException,
  ConflictException,
  CustomException,
  InternalServerException,
  UnauthorizedException,
  ValidationException,
} from '../common/exceptions/index.js';

import { ResponseService } from '../core/response-management/index.js';
import { sendResponse } from '../utils/send-response.util.js';

function mapUnknownError(error: unknown): CustomException {
  // Already a custom application exception
  if (error instanceof CustomException) {
    return error;
  }

  const err = error as {
    name?: string;
    message?: string;
    code?: number | string;
    keyValue?: unknown;
    errors?: Record<
      string,
      {
        message: string;
        path: string;
      }
    >;
    stack?: string;
  };

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return new ConflictException(
      'Resource already exists',
      'UNIQUE_CONSTRAINT',
      {
        originalError: err.message,
        keyValue: err.keyValue,
      }
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((item) => ({
      path: item.path,
      message: item.message,
    }));

    return new ValidationException(
      'Validation failed',
      'MONGOOSE_VALIDATION',
      {
        originalError: err.message,
      },
      details
    );
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return new BadRequestException(
      'Invalid ID format',
      'CAST_ERROR',
      {
        originalError: err.message,
      }
    );
  }

  // JWT invalid token
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedException(
      'Invalid token',
      'JWT_ERROR',
      {
        originalError: err.message,
      }
    );
  }

  // JWT expired token
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedException(
      'Token expired',
      'JWT_EXPIRED',
      {
        originalError: err.message,
      }
    );
  }

  // Unknown error
  console.error('========== UNKNOWN ERROR ==========');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  console.error('KeyValue:', err.keyValue);
  console.error('Stack:', err.stack);
  console.error('Full Error:', error);
  console.error('===================================');

  return new InternalServerException(
    'Internal server error',
    'UNKNOWN_ERROR',
    {
      originalError: err.message,
    }
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const mapped = mapUnknownError(error);

  const responseService = ResponseService.getInstance();

  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    name: mapped.name,
    message: mapped.message,
    context: mapped.context,
    stack: mapped.stack,
  });

  const payload = responseService.error(
    mapped.responseCode,
    mapped.message,
    mapped.errors
  );

  sendResponse(res, payload);
}

export function notFoundHandler(
  req: Request,
  res: Response
): void {
  const responseService = ResponseService.getInstance();

  const payload = responseService.notFound(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  sendResponse(res, payload);
}