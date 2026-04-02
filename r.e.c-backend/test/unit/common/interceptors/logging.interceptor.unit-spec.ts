import { LoggingInterceptor } from '../../../../src/common/interceptors/logging.interceptor';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: Record<string, jest.Mock>;

  beforeEach(() => {
    mockLogger = {
      logPerformanceMetric: jest.fn(),
      error: jest.fn(),
    };
    interceptor = new LoggingInterceptor(mockLogger as any);
  });

  const makeContext = (overrides: Record<string, any> = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        user: { userId: 1, institutionId: 1 },
        ...overrides.request,
      }),
      getResponse: () => ({
        statusCode: 200,
        ...overrides.response,
      }),
    }),
  });

  it('logs performance metric on success', (done) => {
    const context = makeContext();
    const handler = { handle: () => of({ data: 'ok' }) };

    interceptor.intercept(context as any, handler).subscribe({
      next: () => {
        expect(mockLogger.logPerformanceMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint: '/test',
            method: 'GET',
            statusCode: 200,
            userId: 1,
            duration: expect.any(Number),
          }),
        );
        done();
      },
    });
  });

  it('logs error on failure', (done) => {
    const context = makeContext();
    const error = new Error('fail');
    const handler = { handle: () => throwError(() => error) };

    interceptor.intercept(context as any, handler).subscribe({
      error: () => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('GET /test'),
          error.stack,
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            userId: 1,
            institutionId: 1,
            error: 'fail',
          }),
        );
        done();
      },
    });
  });

  it('handles missing user gracefully', (done) => {
    const context = makeContext({ request: { user: undefined } });
    const handler = { handle: () => of('ok') };

    interceptor.intercept(context as any, handler).subscribe({
      next: () => {
        expect(mockLogger.logPerformanceMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: undefined,
          }),
        );
        done();
      },
    });
  });
});
