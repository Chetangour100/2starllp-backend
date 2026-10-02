import type { ResponseService } from './response.service.js';
import { ResponseCode } from './response.enum.js';
import type { ApiResponse } from './response.dto.js';

export class ResponseUtil {
  static success<T>(
    responseService: ResponseService,
    data: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.SUCCESS, message, data);
  }

  static created<T>(
    responseService: ResponseService,
    data: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.CREATED, message, data);
  }

  static updated<T>(
    responseService: ResponseService,
    data: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.UPDATED, message, data);
  }

  static deleted(responseService: ResponseService, message?: string): ApiResponse {
    return responseService.success(ResponseCode.DELETED, message, undefined);
  }

  static loginSuccess<T>(
    responseService: ResponseService,
    data: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.LOGIN_SUCCESS, message, data);
  }

  static logoutSuccess(
    responseService: ResponseService,
    message?: string
  ): ApiResponse {
    return responseService.success(ResponseCode.LOGOUT_SUCCESS, message, undefined);
  }

  static noDataFound(
    responseService: ResponseService,
    message?: string
  ): ApiResponse {
    return responseService.success(ResponseCode.NO_DATA_FOUND, message, null);
  }

  static partialSuccess<T>(
    responseService: ResponseService,
    data: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.PARTIAL_SUCCESS, message, data);
  }

  static operationPending<T>(
    responseService: ResponseService,
    data?: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.OPERATION_PENDING, message, data);
  }

  static operationCompleted<T>(
    responseService: ResponseService,
    data?: T,
    message?: string
  ): ApiResponse<T> {
    return responseService.success(ResponseCode.OPERATION_COMPLETED, message, data);
  }
}
