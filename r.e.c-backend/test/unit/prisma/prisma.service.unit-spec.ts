import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PrismaService security', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('bloquea $queryRawUnsafe', async () => {
    await expect(service.$queryRawUnsafe('SELECT 1')).rejects.toThrow(
      'Uso bloqueado: $queryRawUnsafe no esta permitido en Recedu',
    );
  });

  it('bloquea $executeRawUnsafe', async () => {
    await expect(
      service.$executeRawUnsafe('DELETE FROM "User"'),
    ).rejects.toThrow(
      'Uso bloqueado: $executeRawUnsafe no esta permitido en Recedu',
    );
  });
});
