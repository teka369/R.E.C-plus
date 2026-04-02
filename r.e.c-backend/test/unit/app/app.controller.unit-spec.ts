import { AppController } from '../../../src/app.controller';
import { ServiceUnavailableException } from '@nestjs/common';

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

    it('throws ServiceUnavailableException when DB is down', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      await expect(controller.getHealth()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
