import { PerformanceController } from '../../../src/performance/performance.controller';
import { PerformanceService } from '../../../src/performance/performance.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;

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
    controller = new PerformanceController(
      service as unknown as PerformanceService,
    );
  });

  it('getByGrade delegates', () => {
    controller.getByGrade('5th', req);
    expect(service.getByGrade).toHaveBeenCalledWith(actor, '5th');
  });

  it('getByGroup delegates', () => {
    controller.getByGroup(1, req);
    expect(service.getByGroup).toHaveBeenCalledWith(actor, 1);
  });

  it('getGradeRanking delegates', () => {
    controller.getGradeRanking(1, req);
    expect(service.getGradeRanking).toHaveBeenCalledWith(actor, 1);
  });

  it('upsertByGrade delegates', () => {
    const dto = { items: [] } as any;
    controller.upsertByGrade('5th', dto, req);
    expect(service.upsertByGrade).toHaveBeenCalledWith(actor, '5th', dto);
  });

  it('getStudentAcademic delegates', () => {
    controller.getStudentAcademic(5, undefined, req);
    expect(service.getStudentAcademic).toHaveBeenCalledWith(actor, 5, 1);
  });

  it('getGroupAcademicOverview delegates', () => {
    controller.getGroupAcademicOverview(1, undefined, req);
    expect(service.getGroupAcademicOverview).toHaveBeenCalledWith(actor, 1, 1);
  });

  it('upsertStudentAcademic delegates', () => {
    const dto = { nota: 4.5 } as any;
    controller.upsertStudentAcademic(1, 5, 3, dto, req);
    expect(service.upsertStudentAcademic).toHaveBeenCalledWith(
      actor,
      1,
      5,
      3,
      dto,
    );
  });
});
