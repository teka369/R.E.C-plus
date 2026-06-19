import { CommunicationController } from '../../../src/communication/communication.controller';
import { CommunicationService } from '../../../src/communication/communication.service';
import { PublicIdResolver } from '../../../src/common/resolvers/public-id.resolver';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('CommunicationController', () => {
  let controller: CommunicationController;
  let service: Record<string, jest.Mock>;
  let resolver: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;
  const resolvedId = 42;

  beforeEach(() => {
    service = {
      createFeedback: jest.fn(),
      listFeedbackByStudent: jest.fn(),
      listFeedbackByGroup: jest.fn(),
      updateFeedback: jest.fn(),
      deleteFeedback: jest.fn(),
      sendMessage: jest.fn(),
      inbox: jest.fn(),
      sent: jest.fn(),
      markMessageRead: jest.fn(),
      listNotifications: jest.fn(),
      createNotification: jest.fn(),
      markNotificationRead: jest.fn(),
      deleteNotification: jest.fn(),
      getActivityFeed: jest.fn(),
    };
    resolver = {
      resolveGroup: jest.fn().mockResolvedValue(resolvedId),
      resolveStudent: jest.fn().mockResolvedValue(resolvedId),
    };
    controller = new CommunicationController(
      service as unknown as CommunicationService,
      resolver as unknown as PublicIdResolver,
    );
  });

  it('createFeedback delegates', async () => {
    const dto = { content: 'ok' } as any;
    await controller.createFeedback(dto, req);
    expect(service.createFeedback).toHaveBeenCalledWith(dto, actor);
  });

  it('listFeedbackByStudent resolves studentId', async () => {
    await controller.listFeedbackByStudent('uuid-student', req, '2', '10');
    expect(resolver.resolveStudent).toHaveBeenCalledWith('uuid-student', actor);
    expect(service.listFeedbackByStudent).toHaveBeenCalledWith(resolvedId, actor, {
      page: 2,
      limit: 10,
    });
  });

  it('listFeedbackByStudent handles undefined pagination', async () => {
    await controller.listFeedbackByStudent(
      'uuid-student',
      req,
      undefined,
      undefined,
    );
    expect(service.listFeedbackByStudent).toHaveBeenCalledWith(resolvedId, actor, {
      page: undefined,
      limit: undefined,
    });
  });

  it('listFeedbackByGroup resolves groupId', async () => {
    await controller.listFeedbackByGroup('uuid-group', req, '1', '5');
    expect(resolver.resolveGroup).toHaveBeenCalledWith('uuid-group', actor);
    expect(service.listFeedbackByGroup).toHaveBeenCalledWith(resolvedId, actor, {
      page: 1,
      limit: 5,
    });
  });

  it('updateFeedback delegates with Number conversion', async () => {
    const dto = { content: 'updated' } as any;
    await controller.updateFeedback('3', dto, req);
    expect(service.updateFeedback).toHaveBeenCalledWith(3, dto, actor);
  });

  it('deleteFeedback delegates with Number conversion', async () => {
    await controller.deleteFeedback('3', req);
    expect(service.deleteFeedback).toHaveBeenCalledWith(3, actor);
  });

  it('sendMessage delegates', async () => {
    const dto = { to: 2, content: 'hi' } as any;
    await controller.sendMessage(dto, req);
    expect(service.sendMessage).toHaveBeenCalledWith(dto, actor);
  });

  it('inbox delegates with pagination', async () => {
    await controller.inbox('1', '10', req);
    expect(service.inbox).toHaveBeenCalledWith(actor, { page: 1, limit: 10 });
  });

  it('sent delegates', async () => {
    await controller.sent('1', '10', req);
    expect(service.sent).toHaveBeenCalledWith(actor, { page: 1, limit: 10 });
  });

  it('markMessageRead delegates', async () => {
    await controller.markMessageRead({ messageId: 5 } as any, req);
    expect(service.markMessageRead).toHaveBeenCalledWith(5, actor);
  });

  it('listNotifications delegates', async () => {
    await controller.listNotifications('1', '10', req);
    expect(service.listNotifications).toHaveBeenCalledWith(actor, {
      page: 1,
      limit: 10,
    });
  });

  it('createNotification delegates', async () => {
    const dto = { title: 'N' } as any;
    await controller.createNotification(dto, req);
    expect(service.createNotification).toHaveBeenCalledWith(dto, actor);
  });

  it('markNotificationRead delegates', async () => {
    await controller.markNotificationRead({ notificationId: 3 } as any, req);
    expect(service.markNotificationRead).toHaveBeenCalledWith(3, actor);
  });
});
