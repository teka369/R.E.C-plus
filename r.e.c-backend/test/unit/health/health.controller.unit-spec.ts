import { HealthController } from '../../../src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: Record<string, jest.Mock>;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    controller = new HealthController(prisma as any);
  });

  describe('check', () => {
    it('returns ok when DB responds quickly', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.services.database.status).toBe('ok');
      expect(result.services.database.latency).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('returns down when DB throws', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      const result = await controller.check();
      expect(result.status).toBe('down');
      expect(result.services.database.status).toBe('down');
      expect(result.services.database.latency).toBeUndefined();
    });
  });

  describe('metrics', () => {
    it('returns memory and process info', () => {
      const result = controller.metrics();
      expect(result.memory).toBeDefined();
      expect(result.memory.rss).toContain('MB');
      expect(result.memory.heapTotal).toContain('MB');
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.nodeVersion).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.pid).toBeDefined();
      expect(result.cpu).toBeDefined();
    });
  });
});
