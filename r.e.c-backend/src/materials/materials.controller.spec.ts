import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

describe('MaterialsController', () => {
  let controller: MaterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialsController],
      providers: [{ provide: MaterialsService, useValue: {} }],
    }).compile();

    controller = module.get<MaterialsController>(MaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
