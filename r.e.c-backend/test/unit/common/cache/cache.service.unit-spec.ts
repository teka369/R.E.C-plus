import { RedisCacheService } from '../../../../src/common/cache/cache.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let mockCache: Record<string, any>;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      stores: [{ keys: jest.fn() }],
    };
    service = new RedisCacheService(mockCache as any);
  });

  describe('get', () => {
    it('returns cached value', async () => {
      mockCache.get.mockResolvedValue('data');
      const result = await service.get('key');
      expect(result).toBe('data');
      expect(mockCache.get).toHaveBeenCalledWith('key');
    });

    it('returns null when cache miss', async () => {
      mockCache.get.mockResolvedValue(undefined);
      const result = await service.get('missing');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('sets value with TTL in milliseconds', async () => {
      await service.set('key', 'val', 60);
      expect(mockCache.set).toHaveBeenCalledWith('key', 'val', 60000);
    });
  });

  describe('del', () => {
    it('deletes key', async () => {
      await service.del('key');
      expect(mockCache.del).toHaveBeenCalledWith('key');
    });
  });

  describe('delByPattern', () => {
    it('deletes all matching keys', async () => {
      const storeKeys = mockCache.stores[0].keys as jest.Mock;
      storeKeys.mockResolvedValue(['k1', 'k2']);
      mockCache.del.mockResolvedValue(undefined);
      await service.delByPattern('k*');
      expect(storeKeys).toHaveBeenCalledWith('k*');
      expect(mockCache.del).toHaveBeenCalledTimes(2);
      expect(mockCache.del).toHaveBeenCalledWith('k1');
      expect(mockCache.del).toHaveBeenCalledWith('k2');
    });

    it('does nothing when no keys match', async () => {
      const storeKeys = mockCache.stores[0].keys as jest.Mock;
      storeKeys.mockResolvedValue([]);
      await service.delByPattern('none*');
      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it('handles missing store gracefully', async () => {
      const noStoreCache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        stores: [],
      };
      const svc = new RedisCacheService(noStoreCache as any);
      await expect(svc.delByPattern('test*')).resolves.toBeUndefined();
    });
  });
});
