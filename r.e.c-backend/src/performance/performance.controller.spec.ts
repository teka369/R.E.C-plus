import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PublicIdResolver } from '../common/resolvers/public-id.resolver';

describe('PerformanceController', () => {
  let controller: PerformanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        {
          provide: PerformanceService,
          useValue: {
            getByGrade: jest.fn(),
            getByGroup: jest.fn(),
            getGradeRanking: jest.fn(),
            upsertByGrade: jest.fn(),
            getStudentAcademic: jest.fn(),
            getGroupAcademicOverview: jest.fn(),
            upsertStudentAcademic: jest.fn(),
          },
        },
        {
          provide: PublicIdResolver,
          useValue: {
            resolveGroup: jest.fn().mockResolvedValue(1),
            resolveGrade: jest.fn().mockResolvedValue(1),
            resolveStudent: jest.fn().mockResolvedValue(1),
            resolveSubject: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
