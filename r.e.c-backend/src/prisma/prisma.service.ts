import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Bloqueo defensivo: evita consultas raw inseguras en toda la aplicacion.
  override $queryRawUnsafe<T = unknown>(
    _query: string,
    ..._values: any[]
  ): Prisma.PrismaPromise<T> {
    void _query;
    void _values;
    throw new Error(
      'Uso bloqueado: $queryRawUnsafe no esta permitido en Recedu',
    );
  }

  // Bloqueo defensivo: evita ejecucion raw insegura con interpolacion manual.
  override $executeRawUnsafe(
    _query: string,
    ..._values: any[]
  ): Prisma.PrismaPromise<number> {
    void _query;
    void _values;
    throw new Error(
      'Uso bloqueado: $executeRawUnsafe no esta permitido en Recedu',
    );
  }
}
