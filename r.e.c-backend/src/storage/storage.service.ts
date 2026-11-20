import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageAdapter } from './local-storage.adapter';
import { StorageAdapter, StorageObject } from './storage.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapter: StorageAdapter;

  constructor() {
    // Selección por configuración. Por defecto local (dev).
    // Para producción, configurar STORAGE_PROVIDER=s3 y las variables S3_*.
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (provider === 's3') {
      // Adaptador S3 se resuelve dinámicamente para no forzar la dependencia
      // cuando no se usa. Requiere @aws-sdk/client-s3 instalado.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3StorageAdapter } = require('./s3-storage.adapter');
      this.adapter = new S3StorageAdapter();
      this.logger.log('Storage provider: s3');
    } else {
      this.adapter = new LocalStorageAdapter();
      this.logger.log('Storage provider: local');
    }
  }

  get providerName(): string {
    return this.adapter.name;
  }

  put(object: StorageObject): Promise<string> {
    return this.adapter.put(object);
  }

  get(key: string): Promise<Buffer> {
    return this.adapter.get(key);
  }

  delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  getSignedUrl(key: string, ttlSeconds = 300): Promise<string> {
    if (this.adapter.getSignedUrl) {
      return this.adapter.getSignedUrl(key, ttlSeconds);
    }
    return Promise.resolve(key);
  }
}