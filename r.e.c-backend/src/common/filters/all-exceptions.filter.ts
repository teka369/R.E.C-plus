import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    if (status >= 500) {
      this.logger.error(
        {
          correlationId,
          method: request.method,
          url: request.url,
          status,
          error: exception instanceof Error ? exception.stack : exception,
        },
        `Unhandled exception [${correlationId}]`,
      );

      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception, {
          tags: { correlationId },
          extra: {
            method: request.method,
            url: request.url,
          },
        });
      }
    } else {
      this.logger.warn(
        {
          correlationId,
          method: request.method,
          url: request.url,
          status,
        },
        `Client error [${correlationId}]`,
      );
    }

    const body: Record<string, unknown> =
      typeof message === 'string'
        ? { statusCode: status, message, correlationId }
        : { ...message, statusCode: status, correlationId };

    response.status(status).json(body);
  }
}
