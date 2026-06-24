import { ScheduleController } from '../../../src/schedule/schedule.controller';
import { ScheduleService } from '../../../src/schedule/schedule.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;

  beforeEach(() => {
    service = {
      listEntries: jest.fn(),
      createEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      listNotes: jest.fn(),
      createNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
      listEvents: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
    };
    controller = new ScheduleController(service as unknown as ScheduleService);
  });

  // Entries
  it('listEntries delegates', () => {
    controller.listEntries(1, req);
    expect(service.listEntries).toHaveBeenCalledWith(actor, 1);
  });

  it('createEntry delegates', () => {
    const dto = { dia: 'LUNES' } as any;
    controller.createEntry(1, dto, req);
    expect(service.createEntry).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('updateEntry delegates', () => {
    const dto = { dia: 'MARTES' } as any;
    controller.updateEntry(5, dto, req);
    expect(service.updateEntry).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteEntry delegates', () => {
    controller.deleteEntry(5, req);
    expect(service.deleteEntry).toHaveBeenCalledWith(actor, 5);
  });

  // Notes
  it('listNotes delegates', () => {
    controller.listNotes(1, req);
    expect(service.listNotes).toHaveBeenCalledWith(actor, 1);
  });

  it('createNote delegates', () => {
    const dto = { contenido: 'Note' } as any;
    controller.createNote(1, dto, req);
    expect(service.createNote).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('updateNote delegates', () => {
    const dto = { contenido: 'Updated' } as any;
    controller.updateNote(5, dto, req);
    expect(service.updateNote).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteNote delegates', () => {
    controller.deleteNote(5, req);
    expect(service.deleteNote).toHaveBeenCalledWith(actor, 5);
  });

  // Events
  it('listEvents delegates with date range', () => {
    controller.listEvents(1, req, '2026-01-01', '2026-06-30');
    expect(service.listEvents).toHaveBeenCalledWith(
      actor,
      1,
      '2026-01-01',
      '2026-06-30',
    );
  });

  it('listEvents handles undefined dates', () => {
    controller.listEvents(1, req, undefined, undefined);
    expect(service.listEvents).toHaveBeenCalledWith(
      actor,
      1,
      undefined,
      undefined,
    );
  });

  it('createEvent delegates', () => {
    const dto = { titulo: 'Ev' } as any;
    controller.createEvent(1, dto, req);
    expect(service.createEvent).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('updateEvent delegates', () => {
    const dto = { titulo: 'Updated' } as any;
    controller.updateEvent(5, dto, req);
    expect(service.updateEvent).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteEvent delegates', () => {
    controller.deleteEvent(5, req);
    expect(service.deleteEvent).toHaveBeenCalledWith(actor, 5);
  });
});
