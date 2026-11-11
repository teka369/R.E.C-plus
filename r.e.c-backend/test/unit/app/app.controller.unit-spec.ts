import { AppController } from '../../../src/app.controller';

describe('AppController', () => {
  let controller: AppController;
  let prisma: Record<string, jest.Mock>;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    controller = new AppController(prisma as any);
  });

  describe('getRoot', () => {
    it('returns API running message', () => {
      const result = controller.getRoot();
      expect(result).toContain('R.E.C Backend API is running');
    });
  });

  describe('getHealth', () => {
    it('returns ok when DB is connected', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.getHealth();
      expect(result).toEqual({
        status: 'ok',
        service: 'r.e.c-backend',
        db: 'connected',
      });
    });

    it('returns HTTP-200 body when DB is down (Render liveness)', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      const result = await controller.getHealth();
      expect(result).toEqual({
        status: 'degraded',
        service: 'r.e.c-backend',
        db: 'disconnected',
      });
    });
  });
});
