import {
  concealSoftDeleted,
  injectSoftDeleteWhere,
  SOFT_DELETE_UNIQUE_OPS,
} from '../../../src/prisma/soft-delete';

describe('soft-delete findUnique', () => {
  it('no inyecta deletedAt en findUnique (login por email)', () => {
    const args = injectSoftDeleteWhere('findUnique', {
      where: { email: 'ana@test.dev' },
    });
    expect(args.where).toEqual({ email: 'ana@test.dev' });
    expect(SOFT_DELETE_UNIQUE_OPS.has('findUnique')).toBe(true);
  });

  it('sí filtra deletedAt en findMany', () => {
    const args = injectSoftDeleteWhere('findMany', {
      where: { role: 'ESTUDIANTE' },
    });
    expect(args.where).toEqual({ role: 'ESTUDIANTE', deletedAt: null });
  });

  it('oculta un usuario soft-deleted después de findUnique', () => {
    expect(
      concealSoftDeleted('findUnique', {
        id: 1,
        email: 'ana@test.dev',
        deletedAt: new Date(),
      }),
    ).toBeNull();
  });

  it('deja pasar un usuario activo encontrado por email', () => {
    const user = { id: 1, email: 'ana@test.dev', deletedAt: null };
    expect(concealSoftDeleted('findUnique', user)).toBe(user);
  });
});
