import { PerformanceController } from '../../../src/performance/performance.controller';
import { PerformanceService } from '../../../src/performance/performance.service';
import { PublicIdResolver } from '../../../src/common/resolvers/public-id.resolver';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  let service: Record<string, jest.Mock>;
  let resolver: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;
  const resolvedId = 42;

  beforeEach(() => {
    service = {
      getByGrade: jest.fn(),
      getByGroup: jest.fn(),
      getGradeRanking: jest.fn(),
      upsertByGrade: jest.fn(),
      getStudentAcademic: jest.fn(),
      getGroupAcademicOverview: jest.fn(),
      upsertStudentAcademic: jest.fn(),
    };
    resolver = {
      resolveGroup: jest.fn().mockResolvedValue(resolvedId),
      resolveGrade: jest.fn().mockResolvedValue(resolvedId),
      resolveStudent: jest.fn().mockResolvedValue(resolvedId),
      resolveSubject: jest.fn().mockResolvedValue(resolvedId),
    };
    controller = new PerformanceController(
      service as unknown as PerformanceService,
      resolver as unknown as PublicIdResolver,
    );
  });

  it('getByGrade delegates with grade name', () => {
    controller.getByGrade('5th', req);
    expect(service.getByGrade).toHaveBeenCalledWith(actor, '5th');
  });

  it('getByGroup resolves groupId and delegates', async () => {
    await controller.getByGroup('uuid-group', req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith('uuid-group', actor);
    expect(service.getByGroup).toHaveBeenCalledWith(actor, resolvedId);
  });

  it('getGradeRanking resolves gradeId and delegates', async () => {
    await controller.getGradeRanking('uuid-grade', req);
    expect(resolver.resolveGrade).toHaveBeenCalledWith('uuid-grade', actor);
    expect(service.getGradeRanking).toHaveBeenCalledWith(actor, resolvedId);
  });

  it('upsertByGrade delegates with grade name', () => {
    const dto = { items: [] } as any;
    controller.upsertByGrade('5th', dto, req);
    expect(service.upsertByGrade).toHaveBeenCalledWith(actor, '5th', dto);
  });

  it('getStudentAcademic resolves studentId and delegates', async () => {
    await controller.getStudentAcademic('uuid-student', undefined, req);
    expect(resolver.resolveStudent).toHaveBeenCalledWith('uuid-student', actor);
    expect(service.getStudentAcademic).toHaveBeenCalledWith(actor, resolvedId, 1);
  });

  it('getGroupAcademicOverview resolves groupId and delegates', async () => {
    await controller.getGroupAcademicOverview('uuid-group', undefined, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith('uuid-group', actor);
    expect(service.getGroupAcademicOverview).toHaveBeenCalledWith(
      actor,
      resolvedId,
      1,
    );
  });

  it('upsertStudentAcademic resolves all three IDs and delegates', async () => {
    const dto = { nota: 4.5 } as any;
    await controller.upsertStudentAcademic(
      'uuid-group',
      'uuid-student',
      'uuid-subject',
      dto,
      req,
    );
    expect(resolver.resolveGroup).toHaveBeenCalledWith('uuid-group', actor);
    expect(resolver.resolveStudent).toHaveBeenCalledWith('uuid-student', actor);
    expect(resolver.resolveSubject).toHaveBeenCalledWith('uuid-subject', actor);
    expect(service.upsertStudentAcademic).toHaveBeenCalledWith(
      actor,
      resolvedId,
      resolvedId,
      resolvedId,
      dto,
    );
  });
});
