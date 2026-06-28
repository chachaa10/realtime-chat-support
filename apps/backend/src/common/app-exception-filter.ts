import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Response, type Request } from 'express';

import { AppError } from './errors';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request as any).correlationId ?? 'unknown';

    if (exception instanceof AppError) {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.path} → ${exception.code}: ${exception.message}`,
      );
      response.status(exception.statusCode).json({
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.errors ? { errors: exception.errors } : {}),
        },
      });
      return;
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.path} → INTERNAL_ERROR: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
