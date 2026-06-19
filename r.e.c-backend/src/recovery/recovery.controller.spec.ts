import { Test, TestingModule } from '@nestjs/testing';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { PublicIdResolver } from '../common/resolvers/public-id.resolver';

describe('RecoveryController', () => {
  let controller: RecoveryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecoveryController],
      providers: [
        {
          provide: RecoveryService,
          useValue: {
            createRequest: jest.fn(),
            listMyRequests: jest.fn(),
            listGroupRequests: jest.fn(),
            updateRequestStatus: jest.fn(),
            listActivities: jest.fn(),
            createActivity: jest.fn(),
            updateActivity: jest.fn(),
            deleteRequest: jest.fn(),
            deleteActivity: jest.fn(),
            listMessages: jest.fn(),
            createMessage: jest.fn(),
            statsByGroup: jest.fn(),
            statsByStudent: jest.fn(),
            uploadActivityAttachment: jest.fn(),
            getActivityAttachment: jest.fn(),
          },
        },
        {
          provide: PublicIdResolver,
          useValue: {
            resolveGroup: jest.fn().mockResolvedValue(1),
            resolveStudent: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<RecoveryController>(RecoveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
