import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageAdapter } from './local-storage.adapter';

@Module({
  providers: [LocalStorageAdapter, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
