import { MessageService, type Message } from '../messages/index.js';
import { ResponseCode } from './response.enum.js';
import { HttpStatus } from './http-status.enum.js';
import type { SuccessResponse, ErrorResponse } from './response.dto.js';

export class ResponseService {
  private static instance: ResponseService;
  private readonly messageService: MessageService;

  private constructor(messageService: MessageService = MessageService.getInstance()) {
    this.messageService = messageService;
  }

  public static getInstance(): ResponseService {
    if (!ResponseService.instance) {
      ResponseService.instance = new ResponseService();
    }
    return ResponseService.instance;
  }

  success<T>(
    responseCode: ResponseCode,
    message?: Message | string,
    data?: T,
    messageParams?: Record<string, string | number>
  ): SuccessResponse<T> {
    const httpStatus = this.getHttpStatusFromResponseCode(responseCode);
    const responseMessage = this.resolveMessage(responseCode, message, messageParams);

    return {
      statusCode: httpStatus,
      responseCode,
      message: responseMessage,
      data,
    };
  }

  error(
    responseCode: ResponseCode,
    message?: Message | string,
    errors?: unknown[],
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    const httpStatus = this.getHttpStatusFromResponseCode(responseCode);
    const responseMessage = this.resolveMessage(responseCode, message, messageParams);

    return {
      statusCode: httpStatus,
      responseCode,
      message: responseMessage,
      data: null,
      errors,
    };
  }

  validationError(
    message?: Message | string,
    errors?: unknown[],
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.VALIDATION_ERROR, message, errors, messageParams);
  }

  notFound(
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.NOT_FOUND_ERROR, message, undefined, messageParams);
  }

  internalError(
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.INTERNAL_SERVER_ERROR, message, undefined, messageParams);
  }

  unauthorized(
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.AUTHENTICATION_ERROR, message, undefined, messageParams);
  }

  forbidden(
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.AUTHORIZATION_ERROR, message, undefined, messageParams);
  }

  conflict(
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.CONFLICT_ERROR, message, undefined, messageParams);
  }

  badRequest(
    message?: Message | string,
    errors?: unknown[],
    messageParams?: Record<string, string | number>
  ): ErrorResponse {
    return this.error(ResponseCode.BAD_REQUEST_ERROR, message, errors, messageParams);
  }

  private resolveMessage(
    responseCode: ResponseCode,
    message?: Message | string,
    messageParams?: Record<string, string | number>
  ): string {
    if (!message) {
      return this.getDefaultMessage(responseCode);
    }

    if (typeof message === 'string') {
      return message;
    }

    return this.messageService.getMessage(message, messageParams);
  }

  private getHttpStatusFromResponseCode(responseCode: ResponseCode): HttpStatus {
    const statusMap: Record<ResponseCode, HttpStatus> = {
      [ResponseCode.SUCCESS]: HttpStatus.OK,
      [ResponseCode.CREATED]: HttpStatus.CREATED,
      [ResponseCode.UPDATED]: HttpStatus.OK,
      [ResponseCode.DELETED]: HttpStatus.OK,
      [ResponseCode.RETRIEVED]: HttpStatus.OK,
      [ResponseCode.LOGIN_SUCCESS]: HttpStatus.OK,
      [ResponseCode.LOGOUT_SUCCESS]: HttpStatus.OK,
      [ResponseCode.VALIDATION_SUCCESS]: HttpStatus.OK,
      [ResponseCode.PROCESSING_SUCCESS]: HttpStatus.OK,
      [ResponseCode.VALIDATION_ERROR]: HttpStatus.UNPROCESSABLE_ENTITY,
      [ResponseCode.AUTHENTICATION_ERROR]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.AUTHORIZATION_ERROR]: HttpStatus.FORBIDDEN,
      [ResponseCode.NOT_FOUND_ERROR]: HttpStatus.NOT_FOUND,
      [ResponseCode.CONFLICT_ERROR]: HttpStatus.CONFLICT,
      [ResponseCode.BAD_REQUEST_ERROR]: HttpStatus.BAD_REQUEST,
      [ResponseCode.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [ResponseCode.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [ResponseCode.EXTERNAL_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY,
      [ResponseCode.RATE_LIMIT_ERROR]: HttpStatus.TOO_MANY_REQUESTS,
      [ResponseCode.NETWORK_ERROR]: HttpStatus.BAD_GATEWAY,
      [ResponseCode.TIMEOUT_ERROR]: HttpStatus.GATEWAY_TIMEOUT,
      [ResponseCode.MAINTENANCE_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
      [ResponseCode.INSUFFICIENT_PERMISSIONS]: HttpStatus.FORBIDDEN,
      [ResponseCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.ACCOUNT_LOCKED]: HttpStatus.FORBIDDEN,
      [ResponseCode.ACCOUNT_SUSPENDED]: HttpStatus.FORBIDDEN,
      [ResponseCode.EMAIL_NOT_VERIFIED]: HttpStatus.FORBIDDEN,
      [ResponseCode.PHONE_NOT_VERIFIED]: HttpStatus.FORBIDDEN,
      [ResponseCode.PASSWORD_EXPIRED]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.SESSION_EXPIRED]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
      [ResponseCode.DUPLICATE_ENTRY]: HttpStatus.CONFLICT,
      [ResponseCode.RESOURCE_NOT_AVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [ResponseCode.OPERATION_NOT_ALLOWED]: HttpStatus.FORBIDDEN,
      [ResponseCode.QUOTA_EXCEEDED]: HttpStatus.TOO_MANY_REQUESTS,
      [ResponseCode.PAYMENT_REQUIRED]: HttpStatus.BAD_REQUEST,
      [ResponseCode.FORBIDDEN_OPERATION]: HttpStatus.FORBIDDEN,
      [ResponseCode.INVALID_FORMAT]: HttpStatus.BAD_REQUEST,
      [ResponseCode.MISSING_REQUIRED_FIELD]: HttpStatus.BAD_REQUEST,
      [ResponseCode.INVALID_VALUE]: HttpStatus.BAD_REQUEST,
      [ResponseCode.FILE_TOO_LARGE]: HttpStatus.BAD_REQUEST,
      [ResponseCode.UNSUPPORTED_FILE_TYPE]: HttpStatus.BAD_REQUEST,
      [ResponseCode.UPLOAD_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
      [ResponseCode.DOWNLOAD_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
      [ResponseCode.PROCESSING_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
      [ResponseCode.CONNECTION_FAILED]: HttpStatus.BAD_GATEWAY,
      [ResponseCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [ResponseCode.MAINTENANCE_MODE]: HttpStatus.SERVICE_UNAVAILABLE,
      [ResponseCode.FEATURE_DISABLED]: HttpStatus.FORBIDDEN,
      [ResponseCode.BETA_FEATURE]: HttpStatus.OK,
      [ResponseCode.DEPRECATED_API]: HttpStatus.BAD_REQUEST,
      [ResponseCode.VERSION_NOT_SUPPORTED]: HttpStatus.BAD_REQUEST,
      [ResponseCode.UPGRADE_REQUIRED]: HttpStatus.BAD_REQUEST,
      [ResponseCode.PARTIAL_SUCCESS]: HttpStatus.OK,
      [ResponseCode.NO_DATA_FOUND]: HttpStatus.NOT_FOUND,
      [ResponseCode.ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [ResponseCode.OPERATION_CANCELLED]: HttpStatus.BAD_REQUEST,
      [ResponseCode.OPERATION_PENDING]: HttpStatus.ACCEPTED,
      [ResponseCode.OPERATION_COMPLETED]: HttpStatus.OK,
    };

    return statusMap[responseCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getDefaultMessage(responseCode: ResponseCode): string {
    const defaultMessages: Record<ResponseCode, string> = {
      [ResponseCode.SUCCESS]: 'Operation completed successfully',
      [ResponseCode.CREATED]: 'Resource created successfully',
      [ResponseCode.UPDATED]: 'Resource updated successfully',
      [ResponseCode.DELETED]: 'Resource deleted successfully',
      [ResponseCode.RETRIEVED]: 'Resource retrieved successfully',
      [ResponseCode.LOGIN_SUCCESS]: 'Login successful',
      [ResponseCode.LOGOUT_SUCCESS]: 'Logout successful',
      [ResponseCode.VALIDATION_SUCCESS]: 'Validation completed successfully',
      [ResponseCode.PROCESSING_SUCCESS]: 'Processing completed successfully',
      [ResponseCode.VALIDATION_ERROR]: 'Validation failed',
      [ResponseCode.AUTHENTICATION_ERROR]: 'Authentication failed',
      [ResponseCode.AUTHORIZATION_ERROR]: 'Authorization failed',
      [ResponseCode.NOT_FOUND_ERROR]: 'Resource not found',
      [ResponseCode.CONFLICT_ERROR]: 'Resource conflict',
      [ResponseCode.BAD_REQUEST_ERROR]: 'Bad request',
      [ResponseCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [ResponseCode.DATABASE_ERROR]: 'Database operation failed',
      [ResponseCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
      [ResponseCode.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
      [ResponseCode.NETWORK_ERROR]: 'Network error',
      [ResponseCode.TIMEOUT_ERROR]: 'Request timeout',
      [ResponseCode.MAINTENANCE_ERROR]: 'System under maintenance',
      [ResponseCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
      [ResponseCode.INVALID_CREDENTIALS]: 'Invalid credentials',
      [ResponseCode.ACCOUNT_LOCKED]: 'Account is locked',
      [ResponseCode.ACCOUNT_SUSPENDED]: 'Account is suspended',
      [ResponseCode.EMAIL_NOT_VERIFIED]: 'Email not verified',
      [ResponseCode.PHONE_NOT_VERIFIED]: 'Phone not verified',
      [ResponseCode.PASSWORD_EXPIRED]: 'Password has expired',
      [ResponseCode.SESSION_EXPIRED]: 'Session has expired',
      [ResponseCode.TOKEN_EXPIRED]: 'Token has expired',
      [ResponseCode.INVALID_TOKEN]: 'Invalid token',
      [ResponseCode.DUPLICATE_ENTRY]: 'Duplicate entry',
      [ResponseCode.RESOURCE_NOT_AVAILABLE]: 'Resource not available',
      [ResponseCode.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
      [ResponseCode.QUOTA_EXCEEDED]: 'Quota exceeded',
      [ResponseCode.PAYMENT_REQUIRED]: 'Payment required',
      [ResponseCode.FORBIDDEN_OPERATION]: 'Forbidden operation',
      [ResponseCode.INVALID_FORMAT]: 'Invalid format',
      [ResponseCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
      [ResponseCode.INVALID_VALUE]: 'Invalid value',
      [ResponseCode.FILE_TOO_LARGE]: 'File too large',
      [ResponseCode.UNSUPPORTED_FILE_TYPE]: 'Unsupported file type',
      [ResponseCode.UPLOAD_FAILED]: 'Upload failed',
      [ResponseCode.DOWNLOAD_FAILED]: 'Download failed',
      [ResponseCode.PROCESSING_FAILED]: 'Processing failed',
      [ResponseCode.CONNECTION_FAILED]: 'Connection failed',
      [ResponseCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
      [ResponseCode.MAINTENANCE_MODE]: 'System in maintenance mode',
      [ResponseCode.FEATURE_DISABLED]: 'Feature is disabled',
      [ResponseCode.BETA_FEATURE]: 'This is a beta feature',
      [ResponseCode.DEPRECATED_API]: 'API is deprecated',
      [ResponseCode.VERSION_NOT_SUPPORTED]: 'Version not supported',
      [ResponseCode.UPGRADE_REQUIRED]: 'Upgrade required',
      [ResponseCode.PARTIAL_SUCCESS]: 'Operation completed with partial success',
      [ResponseCode.NO_DATA_FOUND]: 'No data found',
      [ResponseCode.ALREADY_EXISTS]: 'Resource already exists',
      [ResponseCode.OPERATION_CANCELLED]: 'Operation was cancelled',
      [ResponseCode.OPERATION_PENDING]: 'Operation is pending',
      [ResponseCode.OPERATION_COMPLETED]: 'Operation completed successfully',
    };

    return defaultMessages[responseCode] || 'Unknown response';
  }
}
