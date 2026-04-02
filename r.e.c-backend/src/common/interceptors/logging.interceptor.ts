import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../../logger/logger.service';

type RequestWithUser = {
  user?: { userId: number; institutionId?: number | null };
  method: string;
  url: string;
  ip: string;
};

type ResponseType = {
  statusCode: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<ResponseType>();
    const startTime = Date.now();

    const { method, url, user, ip } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logPerformanceMetric({
            endpoint: url,
            method,
            duration,
            statusCode: response.statusCode,
            userId: user?.userId,
          });
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(`Request failed: ${method} ${url}`, err.stack, {
            method,
            url,
            duration,
            userId: user?.userId,
            institutionId: user?.institutionId ?? undefined,
            error: err.message,
            ip,
          });
        },
      }),
    );
  }
}
