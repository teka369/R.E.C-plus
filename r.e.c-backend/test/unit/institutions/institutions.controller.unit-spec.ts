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
      update: jest.fn(),
      delete: jest.fn(),
      listPeriods: jest.fn(),
      getActivePeriod: jest.fn(),
      createPeriod: jest.fn(),
      activatePeriod: jest.fn(),
      closePeriod: jest.fn(),
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
    controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('update delegates', () => {
    const dto = { nombre: 'Updated' } as any;
    controller.update(5, dto);
    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('remove delegates', () => {
    controller.remove(5);
    expect(service.delete).toHaveBeenCalledWith(5);
  });

  it('listPeriods delegates', () => {
    controller.listPeriods(5);
    expect(service.listPeriods).toHaveBeenCalledWith(5);
  });

  it('getActivePeriod delegates', () => {
    controller.getActivePeriod(5);
    expect(service.getActivePeriod).toHaveBeenCalledWith(5);
  });

  it('createPeriod delegates', () => {
    const dto = {
      nombre: 'P1',
      codigo: 'C1',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-06-30',
    };
    controller.createPeriod(5, dto);
    expect(service.createPeriod).toHaveBeenCalledWith(5, dto);
  });

  it('activatePeriod delegates', () => {
    controller.activatePeriod(5, 10);
    expect(service.activatePeriod).toHaveBeenCalledWith(5, 10);
  });

  it('closePeriod delegates', () => {
    controller.closePeriod(5, 10);
    expect(service.closePeriod).toHaveBeenCalledWith(5, 10);
  });
});
