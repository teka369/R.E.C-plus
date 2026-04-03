import { InstitutionsController } from '../../../src/institutions/institutions.controller';
import { InstitutionsService } from '../../../src/institutions/institutions.service';

describe('InstitutionsController', () => {
  let controller: InstitutionsController;
  let service: Record<string, jest.Mock>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      provision: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneByPublicId: jest.fn(),
      update: jest.fn(),
      updateByPublicId: jest.fn(),
      delete: jest.fn(),
      deleteByPublicId: jest.fn(),
      listPeriods: jest.fn(),
      listPeriodsByPublicId: jest.fn(),
      getActivePeriod: jest.fn(),
      getActivePeriodByPublicId: jest.fn(),
      createPeriod: jest.fn(),
      createPeriodByPublicId: jest.fn(),
      activatePeriod: jest.fn(),
      activatePeriodByPublicId: jest.fn(),
      closePeriod: jest.fn(),
      closePeriodByPublicId: jest.fn(),
    };
    controller = new InstitutionsController(
      service as unknown as InstitutionsService,
    );
  });

  it('create delegates', () => {
    const dto = { nombre: 'Inst' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('provision delegates', () => {
    const dto = { nombre: 'Inst', adminEmail: 'a@b.co' } as any;
    controller.provision(dto);
    expect(service.provision).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates', () => {
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne delegates', () => {
    controller.findOne('uuid-inst-5');
    expect(service.findOneByPublicId).toHaveBeenCalledWith('uuid-inst-5');
  });

  it('update delegates', () => {
    const dto = { nombre: 'Updated' } as any;
    controller.update('uuid-inst-5', dto);
    expect(service.updateByPublicId).toHaveBeenCalledWith('uuid-inst-5', dto);
  });

  it('remove delegates', () => {
    controller.remove('uuid-inst-5');
    expect(service.deleteByPublicId).toHaveBeenCalledWith('uuid-inst-5');
  });

  it('listPeriods delegates', () => {
    controller.listPeriods('uuid-inst-5');
    expect(service.listPeriodsByPublicId).toHaveBeenCalledWith('uuid-inst-5');
  });

  it('getActivePeriod delegates', () => {
    controller.getActivePeriod('uuid-inst-5');
    expect(service.getActivePeriodByPublicId).toHaveBeenCalledWith('uuid-inst-5');
  });

  it('createPeriod delegates', () => {
    const dto = {
      nombre: 'P1',
      codigo: 'C1',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-06-30',
    };
    controller.createPeriod('uuid-inst-5', dto);
    expect(service.createPeriodByPublicId).toHaveBeenCalledWith('uuid-inst-5', dto);
  });

  it('activatePeriod delegates', () => {
    controller.activatePeriod('uuid-inst-5', 10);
    expect(service.activatePeriodByPublicId).toHaveBeenCalledWith('uuid-inst-5', 10);
  });

  it('closePeriod delegates', () => {
    controller.closePeriod('uuid-inst-5', 10);
    expect(service.closePeriodByPublicId).toHaveBeenCalledWith('uuid-inst-5', 10);
  });
});
