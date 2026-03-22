import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let prisma: {
    feedback: {
      findUnique: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
    feedbackStrength: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    feedbackImprovement: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    message: {
      create: jest.Mock;
    };
    notification: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      feedback: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      feedbackStrength: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      feedbackImprovement: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('denies cross-institution deleteFeedback with zero side effects', async () => {
    const feedbackRow = {
      id: 55,
      teacherId: 2001,
      deletedAt: null,
      group: { institutionId: 200 },
    };
    prisma.feedback.findUnique.mockResolvedValue(feedbackRow);

    const actor = {
      userId: 2001,
      role: UserRole.PROFESOR,
      institutionId: 100,
    };

    await expect(service.deleteFeedback(55, actor)).rejects.toThrow(
      ForbiddenException,
    );

    // Read occurs first to resolve ownership/institution context.
    expect(prisma.feedback.findUnique).toHaveBeenCalledTimes(1);

    // No write path should run after cross-tenant denial.
    expect(prisma.feedback.delete).not.toHaveBeenCalled();
    expect(prisma.feedback.update).not.toHaveBeenCalled();

    // No cascade/secondary operations should run.
    expect(prisma.feedbackStrength.deleteMany).not.toHaveBeenCalled();
    expect(prisma.feedbackImprovement.deleteMany).not.toHaveBeenCalled();
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    // No soft-delete style mutation in-memory before throw.
    expect(feedbackRow.deletedAt).toBeNull();
  });
});
