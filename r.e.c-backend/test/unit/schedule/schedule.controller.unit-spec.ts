import { ScheduleController } from '../../../src/schedule/schedule.controller';
import { ScheduleService } from '../../../src/schedule/schedule.service';
import { PublicIdResolver } from '../../../src/common/resolvers/public-id.resolver';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: Record<string, jest.Mock>;
  let resolver: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;

  const publicGroupId = 'uuid-group';
  const resolvedId = 42;

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
    resolver = {
      resolveGroup: jest.fn().mockResolvedValue(resolvedId),
    };
    controller = new ScheduleController(
      service as unknown as ScheduleService,
      resolver as unknown as PublicIdResolver,
    );
  });

  it('listEntries resolves groupId and delegates', async () => {
    await controller.listEntries(publicGroupId, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.listEntries).toHaveBeenCalledWith(actor, resolvedId);
  });

  it('createEntry resolves groupId and delegates', async () => {
    const dto = { dia: 'LUNES' } as any;
    await controller.createEntry(publicGroupId, dto, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.createEntry).toHaveBeenCalledWith(actor, resolvedId, dto);
  });

  it('updateEntry delegates directly (internal id)', () => {
    const dto = { dia: 'MARTES' } as any;
    controller.updateEntry(5, dto, req);
    expect(service.updateEntry).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteEntry delegates directly (internal id)', () => {
    controller.deleteEntry(5, req);
    expect(service.deleteEntry).toHaveBeenCalledWith(actor, 5);
  });

  it('listNotes resolves groupId and delegates', async () => {
    await controller.listNotes(publicGroupId, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.listNotes).toHaveBeenCalledWith(actor, resolvedId);
  });

  it('createNote resolves groupId and delegates', async () => {
    const dto = { contenido: 'Note' } as any;
    await controller.createNote(publicGroupId, dto, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.createNote).toHaveBeenCalledWith(actor, resolvedId, dto);
  });

  it('updateNote delegates directly (internal id)', () => {
    const dto = { contenido: 'Updated' } as any;
    controller.updateNote(5, dto, req);
    expect(service.updateNote).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteNote delegates directly (internal id)', () => {
    controller.deleteNote(5, req);
    expect(service.deleteNote).toHaveBeenCalledWith(actor, 5);
  });

  it('listEvents resolves groupId with date range', async () => {
    await controller.listEvents(publicGroupId, req, '2026-01-01', '2026-06-30');
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.listEvents).toHaveBeenCalledWith(
      actor,
      resolvedId,
      '2026-01-01',
      '2026-06-30',
    );
  });

  it('listEvents handles undefined dates', async () => {
    await controller.listEvents(publicGroupId, req, undefined, undefined);
    expect(service.listEvents).toHaveBeenCalledWith(
      actor,
      resolvedId,
      undefined,
      undefined,
    );
  });

  it('createEvent resolves groupId and delegates', async () => {
    const dto = { titulo: 'Ev' } as any;
    await controller.createEvent(publicGroupId, dto, req);
    expect(resolver.resolveGroup).toHaveBeenCalledWith(publicGroupId, actor);
    expect(service.createEvent).toHaveBeenCalledWith(actor, resolvedId, dto);
  });

  it('updateEvent delegates directly (internal id)', () => {
    const dto = { titulo: 'Updated' } as any;
    controller.updateEvent(5, dto, req);
    expect(service.updateEvent).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteEvent delegates directly (internal id)', () => {
    controller.deleteEvent(5, req);
    expect(service.deleteEvent).toHaveBeenCalledWith(actor, 5);
  });
});
