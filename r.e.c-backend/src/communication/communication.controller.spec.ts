import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { PublicIdResolver } from '../common/resolvers/public-id.resolver';

describe('CommunicationController', () => {
  let controller: CommunicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationController],
      providers: [
        { provide: CommunicationService, useValue: {} },
        {
          provide: PublicIdResolver,
          useValue: {
            resolveGroup: jest.fn().mockResolvedValue(1),
            resolveStudent: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<CommunicationController>(CommunicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
