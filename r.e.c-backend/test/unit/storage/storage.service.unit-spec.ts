import { Test } from '@nestjs/testing';
import { StorageService } from '../../../src/storage/storage.service';
import { LocalStorageAdapter } from '../../../src/storage/local-storage.adapter';

describe('StorageService (local)', () => {
  let service: StorageService;
  const tmpRoot = 'tmp-storage-test';

  beforeAll(() => {
    process.env.STORAGE_PROVIDER = 'local';
    process.env.STORAGE_LOCAL_ROOT = tmpRoot;
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LocalStorageAdapter, StorageService],
    }).compile();
    service = module.get(StorageService);
  });

  it('put/get/delete roundtrip', async () => {
    const key = 'dir/file.txt';
    await service.put({ key, buffer: Buffer.from('hello'), mimeType: 'text/plain' });
    const buf = await service.get(key);
    expect(buf.toString()).toBe('hello');
    await service.delete(key);
    await expect(service.get(key)).rejects.toThrow();
  });

  afterAll(() => {
    const fs = require('node:fs');
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});