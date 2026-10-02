import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationException } from '../common/exceptions/index.js';

type RequestTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodType, target: RequestTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      next(new ValidationException('Validation failed', 'ZOD_VALIDATION', undefined, errors));
      return;
    }

    req[target] = result.data as never;
    next();
  };
