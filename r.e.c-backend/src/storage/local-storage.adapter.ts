import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { StorageAdapter, StorageObject } from './storage.interface';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local';
  private readonly root = process.env.STORAGE_LOCAL_ROOT || 'uploads';

  private resolve(key: string): string {
    // Prevent path traversal
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(path.resolve(this.root))) {
      throw new Error('Invalid storage key');
    }
    return resolved;
  }

  async put(object: StorageObject): Promise<string> {
    const filePath = this.resolve(object.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, object.buffer);
    return object.key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch {
      // ignore missing
    }
  }
}