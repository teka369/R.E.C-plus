import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PrismaService security', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('bloquea $queryRawUnsafe', () => {
    expect(() => service.$queryRawUnsafe('SELECT 1')).toThrow(
      'Uso bloqueado: $queryRawUnsafe no esta permitido en Recedu',
    );
  });

  it('bloquea $executeRawUnsafe', () => {
    expect(() => service.$executeRawUnsafe('DELETE FROM "User"')).toThrow(
      'Uso bloqueado: $executeRawUnsafe no esta permitido en Recedu',
    );
  });
});
