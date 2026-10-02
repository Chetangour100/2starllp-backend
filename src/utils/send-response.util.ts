import type { Response as ExpressResponse } from 'express';
import type { ApiResponse, ErrorResponse } from '../core/response-management/response.dto.js';

export function sendResponse<T>(
  res: ExpressResponse,
  payload: ApiResponse<T> | ErrorResponse
): ExpressResponse {
  return res.status(payload.statusCode).json(payload);
}
