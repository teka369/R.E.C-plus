import { CommunicationController } from '../../../src/communication/communication.controller';
import { CommunicationService } from '../../../src/communication/communication.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('CommunicationController', () => {
  let controller: CommunicationController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;

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
    };
    controller = new CommunicationController(
      service as unknown as CommunicationService,
    );
  });

  // Feedback
  it('createFeedback delegates', async () => {
    const dto = { content: 'ok' } as any;
    await controller.createFeedback(dto, req);
    expect(service.createFeedback).toHaveBeenCalledWith(dto, actor);
  });

  it('listFeedbackByStudent delegates with pagination', async () => {
    await controller.listFeedbackByStudent('5', req, '2', '10');
    expect(service.listFeedbackByStudent).toHaveBeenCalledWith(5, actor, {
      page: 2,
      limit: 10,
    });
  });

  it('listFeedbackByStudent handles undefined pagination', async () => {
    await controller.listFeedbackByStudent('5', req, undefined, undefined);
    expect(service.listFeedbackByStudent).toHaveBeenCalledWith(5, actor, {
      page: undefined,
      limit: undefined,
    });
  });

  it('listFeedbackByGroup delegates', async () => {
    await controller.listFeedbackByGroup('1', req, '1', '5');
    expect(service.listFeedbackByGroup).toHaveBeenCalledWith(1, actor, {
      page: 1,
      limit: 5,
    });
  });

  it('updateFeedback delegates', async () => {
    const dto = { content: 'updated' } as any;
    await controller.updateFeedback('3', dto, req);
    expect(service.updateFeedback).toHaveBeenCalledWith(3, dto, actor);
  });

  it('deleteFeedback delegates', async () => {
    await controller.deleteFeedback('3', req);
    expect(service.deleteFeedback).toHaveBeenCalledWith(3, actor);
  });

  // Messages
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

  // Notifications
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
