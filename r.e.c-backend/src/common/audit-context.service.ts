import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId?: number;
  institutionId?: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  /** Ejecuta un callback dentro de un contexto de auditoría. */
  run(context: AuditContext, fn: () => void): void {
    this.storage.run(context, fn);
  }

  /** Obtiene el contexto de auditoría de la request actual (o undefined). */
  get(): AuditContext | undefined {
    return this.storage.getStore();
  }
}
