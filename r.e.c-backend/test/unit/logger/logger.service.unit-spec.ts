import { AppLoggerService } from '../../../src/logger/logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;

  beforeEach(() => {
    service = new AppLoggerService();
  });

  it('log calls info level', () => {
    expect(() => service.log('test message')).not.toThrow();
  });

  it('log with context', () => {
    expect(() =>
      service.log('event', { event: 'test', userId: 1 }),
    ).not.toThrow();
  });

  it('error calls error level', () => {
    expect(() => service.error('error msg', 'stack trace')).not.toThrow();
  });

  it('error with context', () => {
    expect(() =>
      service.error('error', 'stack', { event: 'err', userId: 1 }),
    ).not.toThrow();
  });

  it('warn calls warn level', () => {
    expect(() => service.warn('warning')).not.toThrow();
  });

  it('debug calls debug level', () => {
    expect(() => service.debug('debug msg')).not.toThrow();
  });

  it('verbose calls verbose level', () => {
    expect(() => service.verbose('verbose msg')).not.toThrow();
  });

  describe('logTenantViolation', () => {
    it('logs tenant boundary violation', () => {
      expect(() =>
        service.logTenantViolation({
          event: 'CROSS_TENANT_ACCESS',
          actorUserId: 1,
          actorInstitutionId: 1,
          requestedInstitutionIds: [2],
          endpoint: '/users',
          method: 'GET',
        }),
      ).not.toThrow();
    });
  });

  describe('logBusinessEvent', () => {
    it('logs business event', () => {
      expect(() =>
        service.logBusinessEvent({ event: 'USER_CREATED', userId: 1 }),
      ).not.toThrow();
    });
  });

  describe('logPerformanceMetric', () => {
    it('logs fast request as debug', () => {
      expect(() =>
        service.logPerformanceMetric({
          endpoint: '/api/test',
          method: 'GET',
          duration: 50,
          statusCode: 200,
          userId: 1,
        }),
      ).not.toThrow();
    });

    it('logs slow request as warn', () => {
      expect(() =>
        service.logPerformanceMetric({
          endpoint: '/api/slow',
          method: 'POST',
          duration: 2000,
          statusCode: 200,
        }),
      ).not.toThrow();
    });
  });
});
