import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    group: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    academicPeriod: {
      findFirst: jest.Mock;
    };
    studentGroup: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
    groupSubject: {
      upsert: jest.Mock;
      update: jest.Mock;
    };
    academicOffering: {
      upsert: jest.Mock;
    };
    teacherAssignment: {
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      group: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      academicPeriod: {
        findFirst: jest.fn(),
      },
      studentGroup: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      groupSubject: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      academicOffering: {
        upsert: jest.fn(),
      },
      teacherAssignment: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('denies cross-institution enrollment before any relational write', async () => {
    const studentRow = {
      id: 3001,
      role: UserRole.ESTUDIANTE,
      institutionId: 200,
      profile: {
        documents: ['ID-3001'],
      },
    };
    const groupRow = {
      id: 410,
      institutionId: 200,
      relations: {
        students: [3001],
      },
    };

    const studentBaseline = structuredClone(studentRow);
    const groupBaseline = structuredClone(groupRow);

    prisma.user.findUnique.mockResolvedValue(studentRow);
    // Should not be reached in this specific denial path (student mismatch first).
    prisma.group.findUnique.mockResolvedValue(groupRow);

    await expect(
      service.assignStudentToGroup(
        { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
        { studentId: 3001, groupId: 410 },
      ),
    ).rejects.toThrow(ForbiddenException);

    // Read occurs to evaluate scope, then flow must halt.
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);

    // No enrollment write.
    expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    expect(prisma.studentGroup.update).not.toHaveBeenCalled();
    expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();

    // No secondary relationships or indirect side-effects.
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.update).not.toHaveBeenCalled();
    expect(prisma.groupSubject.upsert).not.toHaveBeenCalled();
    expect(prisma.groupSubject.update).not.toHaveBeenCalled();
    expect(prisma.academicOffering.upsert).not.toHaveBeenCalled();
    expect(prisma.group.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    // Defensive assertion: no hidden in-memory mutation.
    expect(studentRow).toEqual(studentBaseline);
    expect(groupRow).toEqual(groupBaseline);
  });

  it('assigns student to group in-scope with exact expected write set', async () => {
    const studentRow = {
      id: 3002,
      role: UserRole.ESTUDIANTE,
      institutionId: 100,
      profile: { documents: ['ID-3002'] },
    };
    const groupRow = {
      id: 411,
      institutionId: 100,
      relations: { students: [] },
    };
    const activePeriod = { id: 77 };
    const createdEnrollment = {
      id: 9001,
      studentId: 3002,
      groupId: 411,
      academicPeriodId: 77,
      status: 'ACTIVE',
    };

    const studentBaseline = structuredClone(studentRow);
    const groupBaseline = structuredClone(groupRow);

    prisma.user.findUnique.mockResolvedValue(studentRow);
    prisma.group.findUnique.mockResolvedValue(groupRow);
    prisma.academicPeriod.findFirst.mockResolvedValue(activePeriod);
    prisma.studentGroup.findFirst.mockResolvedValue(null);
    prisma.studentGroup.create.mockResolvedValue(createdEnrollment);

    const result = await service.assignStudentToGroup(
      { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
      { studentId: 3002, groupId: 411 },
    );

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.group.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.academicPeriod.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.studentGroup.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.studentGroup.create).toHaveBeenCalledTimes(1);

    const userReadOrder = prisma.user.findUnique.mock.invocationCallOrder[0];
    const groupReadOrder = prisma.group.findUnique.mock.invocationCallOrder[0];
    const periodReadOrder =
      prisma.academicPeriod.findFirst.mock.invocationCallOrder[0];
    const existingReadOrder =
      prisma.studentGroup.findFirst.mock.invocationCallOrder[0];
    const createOrder = prisma.studentGroup.create.mock.invocationCallOrder[0];

    expect(userReadOrder).toBeLessThan(groupReadOrder);
    expect(groupReadOrder).toBeLessThan(periodReadOrder);
    expect(periodReadOrder).toBeLessThan(existingReadOrder);
    expect(existingReadOrder).toBeLessThan(createOrder);

    expect(prisma.studentGroup.create).toHaveBeenCalledWith({
      data: {
        studentId: 3002,
        groupId: 411,
        academicPeriodId: 77,
      },
    });
    expect(result).toEqual(createdEnrollment);

    expect(prisma.studentGroup.update).not.toHaveBeenCalled();
    expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.update).not.toHaveBeenCalled();
    expect(prisma.groupSubject.upsert).not.toHaveBeenCalled();
    expect(prisma.groupSubject.update).not.toHaveBeenCalled();
    expect(prisma.academicOffering.upsert).not.toHaveBeenCalled();
    expect(prisma.group.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    expect(studentRow).toEqual(studentBaseline);
    expect(groupRow).toEqual(groupBaseline);
  });
});
