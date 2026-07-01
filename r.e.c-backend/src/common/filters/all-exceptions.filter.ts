import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

const PRISMA_ERROR_MAP: Record<string, { status: HttpStatus; message: string }> = {
  P2000: { status: HttpStatus.BAD_REQUEST, message: 'Valor demasiado largo para uno de los campos' },
  P2002: { status: HttpStatus.CONFLICT, message: 'Ya existe un registro con ese valor único' },
  P2003: { status: HttpStatus.CONFLICT, message: 'El registro referenciado no existe' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Registro no encontrado' },
  P2014: { status: HttpStatus.BAD_REQUEST, message: 'Violación de relación requerida' },
  P2023: { status: HttpStatus.BAD_REQUEST, message: 'Datos inconsistentes en la base de datos' },
};

function isPrismaError(exception: unknown): exception is Prisma.PrismaClientKnownRequestError {
  return (
    exception instanceof Prisma.PrismaClientKnownRequestError &&
    typeof exception.code === 'string'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();

    let status: number;
    let message: string | Record<string, unknown>;

    if (isPrismaError(exception)) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Error interno del servidor';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      message = typeof resp === 'string' ? resp : (resp as Record<string, unknown>);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
    }

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
