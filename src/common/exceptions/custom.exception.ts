import { HttpStatus } from '../../core/response-management/http-status.enum.js';
import { ResponseCode } from '../../core/response-management/response.enum.js';

export abstract class CustomException extends Error {
  public readonly statusCode: HttpStatus;
  public readonly responseCode: ResponseCode;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly context?: string;
  public readonly metadata?: unknown;
  public readonly errors?: unknown[];

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    responseCode: ResponseCode = ResponseCode.INTERNAL_SERVER_ERROR,
    isOperational = true,
    context?: string,
    metadata?: unknown,
    errors?: unknown[]
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.responseCode = responseCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.metadata = metadata;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      responseCode: this.responseCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      context: this.context,
      metadata: this.metadata,
      errors: this.errors,
      stack: this.stack,
    };
  }
}

export class ValidationException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown, errors?: unknown[]) {
    super(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      ResponseCode.VALIDATION_ERROR,
      true,
      context,
      metadata,
      errors
    );
  }
}

export class NotFoundException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(message, HttpStatus.NOT_FOUND, ResponseCode.NOT_FOUND_ERROR, true, context, metadata);
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      ResponseCode.AUTHENTICATION_ERROR,
      true,
      context,
      metadata
    );
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      ResponseCode.AUTHORIZATION_ERROR,
      true,
      context,
      metadata
    );
  }
}

export class ConflictException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(message, HttpStatus.CONFLICT, ResponseCode.CONFLICT_ERROR, true, context, metadata);
  }
}

export class BadRequestException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown, errors?: unknown[]) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      ResponseCode.BAD_REQUEST_ERROR,
      true,
      context,
      metadata,
      errors
    );
  }
}

export class TooManyRequestsException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      ResponseCode.RATE_LIMIT_ERROR,
      true,
      context,
      metadata
    );
  }
}

export class InternalServerException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ResponseCode.INTERNAL_SERVER_ERROR,
      true,
      context,
      metadata
    );
  }
}

export class DatabaseException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ResponseCode.DATABASE_ERROR,
      true,
      context,
      metadata
    );
  }
}

export class ExternalServiceException extends CustomException {
  constructor(message: string, context?: string, metadata?: unknown) {
    super(
      message,
      HttpStatus.BAD_GATEWAY,
      ResponseCode.EXTERNAL_SERVICE_ERROR,
      true,
      context,
      metadata
    );
  }
}
