import type { Request } from 'express';
import { resolveLoginTrackerFromRequest } from '../../../src/auth/login-tracker.util';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('resolveLoginTrackerFromRequest', () => {
  it('mismo X-Forwarded-For y distinto x-visitor-id → mismo tracker', () => {
    const xff = '203.0.113.10';
    const a = mockReq({
      headers: {
        'x-forwarded-for': xff,
        'x-visitor-id': '11111111-1111-4111-8111-111111111111',
      },
      socket: { remoteAddress: '10.0.0.1' } as Request['socket'],
    });
    const b = mockReq({
      headers: {
        'x-forwarded-for': xff,
        'x-visitor-id': '22222222-2222-4222-8222-222222222222',
      },
      socket: { remoteAddress: '10.0.0.2' } as Request['socket'],
    });

    const ta = resolveLoginTrackerFromRequest(a);
    const tb = resolveLoginTrackerFromRequest(b);

    expect(ta).toBe(tb);
    expect(ta).toBe('login:203.0.113.10');
  });

  it('distinto X-Forwarded-For → distinto tracker', () => {
    const reqA = mockReq({
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });
    const reqB = mockReq({
      headers: { 'x-forwarded-for': '198.51.100.2' },
    });

    expect(resolveLoginTrackerFromRequest(reqA)).toBe('login:198.51.100.1');
    expect(resolveLoginTrackerFromRequest(reqB)).toBe('login:198.51.100.2');
    expect(resolveLoginTrackerFromRequest(reqA)).not.toBe(
      resolveLoginTrackerFromRequest(reqB),
    );
  });

  it('sin X-Forwarded-For usa req.socket.remoteAddress', () => {
    const req = mockReq({
      headers: {},
      socket: { remoteAddress: '192.0.2.50' } as Request['socket'],
    });

    expect(resolveLoginTrackerFromRequest(req)).toBe('login:192.0.2.50');
  });
});
