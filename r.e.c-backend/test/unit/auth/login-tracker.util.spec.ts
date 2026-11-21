import type { Request } from 'express';
import { resolveLoginTrackerFromRequest } from '../../../src/auth/login-tracker.util';
import { clientIpFromExpressRequest } from '../../../src/auth/client-ip.util';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('resolveLoginTrackerFromRequest', () => {
  it('ignora X-Forwarded-For rotado si req.ip es estable', () => {
    const a = mockReq({
      ip: '203.0.113.10',
      headers: {
        'x-forwarded-for': '198.51.100.1, 203.0.113.10',
        'x-visitor-id': '11111111-1111-4111-8111-111111111111',
      },
      socket: { remoteAddress: '10.0.0.1' } as Request['socket'],
    });
    const b = mockReq({
      ip: '203.0.113.10',
      headers: {
        'x-forwarded-for': '203.0.113.99',
        'x-visitor-id': '22222222-2222-4222-8222-222222222222',
      },
      socket: { remoteAddress: '10.0.0.2' } as Request['socket'],
    });

    expect(resolveLoginTrackerFromRequest(a)).toBe('login:203.0.113.10');
    expect(resolveLoginTrackerFromRequest(b)).toBe('login:203.0.113.10');
    expect(resolveLoginTrackerFromRequest(a)).toBe(
      resolveLoginTrackerFromRequest(b),
    );
  });

  it('no usa el primer hop de X-Forwarded-For cuando no hay req.ip', () => {
    const reqA = mockReq({
      headers: { 'x-forwarded-for': '198.51.100.1' },
      socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
    });
    const reqB = mockReq({
      headers: { 'x-forwarded-for': '198.51.100.2' },
      socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
    });

    expect(resolveLoginTrackerFromRequest(reqA)).toBe('login:127.0.0.1');
    expect(resolveLoginTrackerFromRequest(reqB)).toBe('login:127.0.0.1');
    expect(clientIpFromExpressRequest(reqA)).not.toBe('198.51.100.1');
  });

  it('sin req.ip usa socket.remoteAddress', () => {
    const req = mockReq({
      headers: {},
      socket: { remoteAddress: '192.0.2.50' } as Request['socket'],
    });

    expect(resolveLoginTrackerFromRequest(req)).toBe('login:192.0.2.50');
  });

  it('prefiere req.ip sobre socket.remoteAddress', () => {
    const req = mockReq({
      ip: '2001:db8::1',
      headers: { 'x-forwarded-for': '203.0.113.8' },
      socket: { remoteAddress: '10.1.1.1' } as Request['socket'],
    });
    expect(resolveLoginTrackerFromRequest(req)).toBe('login:2001:db8::1');
  });
});
