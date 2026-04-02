import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

export interface LogContext {
  event?: string;
  userId?: number;
  institutionId?: number;
  requestId?: string;
  duration?: number;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'rec-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport con formato legible en desarrollo
        new winston.transports.Console({
          format: isProduction
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length
                    ? JSON.stringify(meta, null, 2)
                    : '';
                  return `${timestamp} [${level}]: ${message} ${metaStr}`;
                }),
              ),
        }),
      ],
    });

    // En producción, agregar file transport
    if (isProduction) {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),
      );
    }
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { ...context, stack: trace });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // Métodos específicos del dominio
  logTenantViolation(context: {
    event: string;
    actorUserId: number;
    actorInstitutionId?: number | null;
    requestedInstitutionIds: number[];
    endpoint: string;
    method: string;
  }) {
    this.warn('Tenant boundary violation detected', {
      ...context,
      severity: 'high',
    });
  }

  logBusinessEvent(context: LogContext) {
    this.log('Business event', {
      ...context,
      type: 'business',
    });
  }

  logPerformanceMetric(context: {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    userId?: number;
  }) {
    const level = context.duration > 1000 ? 'warn' : 'debug';
    this.logger.log(level, 'Request completed', {
      ...context,
      type: 'performance',
    });
  }
}
