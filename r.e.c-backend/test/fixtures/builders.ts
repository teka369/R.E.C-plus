import { UserRole } from '../../src/users/dto/user-role.enum';

export function buildActor(overrides?: Partial<{ userId: number; role: UserRole; institutionId: number }>) {
  return {
    userId: overrides?.userId ?? 101,
    role: overrides?.role ?? UserRole.PROFESOR,
    institutionId: overrides?.institutionId ?? 100,
  };
}

export function buildInstitution(overrides?: Partial<{ id: number; nombre: string; slug: string }>) {
  return {
    id: overrides?.id ?? 100,
    nombre: overrides?.nombre ?? 'Colegio Test',
    slug: overrides?.slug ?? 'colegio-test',
  };
}

export function buildGroup(overrides?: Partial<{ id: number; institutionId: number; nombre: string; gradeId: number }>) {
  return {
    id: overrides?.id ?? 301,
    institutionId: overrides?.institutionId ?? 100,
    nombre: overrides?.nombre ?? '10-A',
    gradeId: overrides?.gradeId ?? 201,
  };
}

export function buildRecoveryRequest(
  overrides?: Partial<{
    id: number;
    studentId: number;
    teacherId: number;
    groupId: number;
    institutionId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  }>,
) {
  const institutionId = overrides?.institutionId ?? 100;
  return {
    id: overrides?.id ?? 501,
    studentId: overrides?.studentId ?? 801,
    teacherId: overrides?.teacherId ?? 701,
    groupId: overrides?.groupId ?? 301,
    status: overrides?.status ?? 'PENDING',
    group: {
      id: overrides?.groupId ?? 301,
      institutionId,
      nombre: '10-A',
    },
  };
}
