import { ExecutionContext, RequestTimeoutException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TimeoutError } from 'rxjs';
import { TimeoutInterceptor } from '../../../../src/common/interceptors/timeout.interceptor';

describe('TimeoutInterceptor', () => {
  const interceptor = new TimeoutInterceptor();
  const context = {} as ExecutionContext;

  it('deja pasar una respuesta dentro del tiempo', (done) => {
    interceptor.intercept(context, { handle: () => of('ok') }).subscribe({
      next: (value) => {
        expect(value).toBe('ok');
        done();
      },
      error: done,
    });
  });

  it('convierte TimeoutError en RequestTimeoutException', (done) => {
    interceptor
      .intercept(context, {
        handle: () => throwError(() => new TimeoutError()),
      })
      .subscribe({
        next: () => done(new Error('debio fallar')),
        error: (err: unknown) => {
          expect(err).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
  });

  it('repropaga errores que no son timeout', (done) => {
    const original = new Error('otro');
    interceptor
      .intercept(context, { handle: () => throwError(() => original) })
      .subscribe({
        next: () => done(new Error('debio fallar')),
        error: (err: unknown) => {
          expect(err).toBe(original);
          done();
        },
      });
  });

  it('se puede instanciar sin proveedores de Nest', () => {
    expect(new TimeoutInterceptor()).toBeInstanceOf(TimeoutInterceptor);
  });
});
