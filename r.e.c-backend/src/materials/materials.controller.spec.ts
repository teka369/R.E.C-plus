import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { PublicIdResolver } from '../common/resolvers/public-id.resolver';

describe('MaterialsController', () => {
  let controller: MaterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialsController],
      providers: [
        { provide: MaterialsService, useValue: {} },
        {
          provide: PublicIdResolver,
          useValue: {
            resolveGroup: jest.fn().mockResolvedValue(1),
            resolveSubject: jest.fn().mockResolvedValue(1),
            resolveGrade: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<MaterialsController>(MaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
