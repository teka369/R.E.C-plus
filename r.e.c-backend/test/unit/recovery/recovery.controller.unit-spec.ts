import { StreamableFile } from '@nestjs/common';
import { RecoveryController } from '../../../src/recovery/recovery.controller';
import { RecoveryService } from '../../../src/recovery/recovery.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('RecoveryController', () => {
  let controller: RecoveryController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;
  const studentActor = {
    userId: 5,
    role: UserRole.ESTUDIANTE,
    institutionId: 1,
  };
  const studentReq = { user: studentActor } as any;

  beforeEach(() => {
    service = {
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
      uploadActivityAttachment: jest.fn(),
      getActivityAttachment: jest.fn(),
      createMessage: jest.fn(),
      statsByGroup: jest.fn(),
      statsByStudent: jest.fn(),
    };
    controller = new RecoveryController(service as unknown as RecoveryService);
  });

  it('createRequest delegates', () => {
    const dto = { subjectId: 1 } as any;
    controller.createRequest(dto, studentReq);
    expect(service.createRequest).toHaveBeenCalledWith(studentActor, dto);
  });

  it('listMyRequests delegates with pagination', () => {
    controller.listMyRequests('2', '10', studentReq);
    expect(service.listMyRequests).toHaveBeenCalledWith(studentActor, {
      page: 2,
      limit: 10,
    });
  });

  it('listMyRequests handles undefined pagination', () => {
    controller.listMyRequests(undefined, undefined, studentReq);
    expect(service.listMyRequests).toHaveBeenCalledWith(studentActor, {
      page: undefined,
      limit: undefined,
    });
  });

  it('listGroupRequests delegates', () => {
    controller.listGroupRequests(1, '1', '5', req);
    expect(service.listGroupRequests).toHaveBeenCalledWith(actor, 1, {
      page: 1,
      limit: 5,
    });
  });

  it('updateRequestStatus delegates', () => {
    const dto = { status: 'APPROVED' } as any;
    controller.updateRequestStatus(5, dto, req);
    expect(service.updateRequestStatus).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('listActivities delegates', () => {
    controller.listActivities(3, req);
    expect(service.listActivities).toHaveBeenCalledWith(actor, 3);
  });

  it('createActivity delegates', () => {
    const dto = { titulo: 'Act' } as any;
    controller.createActivity(3, dto, req);
    expect(service.createActivity).toHaveBeenCalledWith(actor, 3, dto);
  });

  it('updateActivity delegates', () => {
    const dto = { titulo: 'Updated' } as any;
    controller.updateActivity(5, dto, req);
    expect(service.updateActivity).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteRequest delegates', () => {
    controller.deleteRequest(5, req);
    expect(service.deleteRequest).toHaveBeenCalledWith(actor, 5);
  });

  it('deleteActivity delegates', () => {
    controller.deleteActivity(5, req);
    expect(service.deleteActivity).toHaveBeenCalledWith(actor, 5);
  });

  it('listMessages delegates', () => {
    controller.listMessages(3, req);
    expect(service.listMessages).toHaveBeenCalledWith(actor, 3);
  });

  it('uploadActivityAttachment delegates', () => {
    const file = {
      originalname: 'f.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from(''),
    };
    controller.uploadActivityAttachment(5, file, req);
    expect(service.uploadActivityAttachment).toHaveBeenCalledWith(
      actor,
      5,
      file,
    );
  });

  it('downloadActivityAttachment delegates and sets headers', async () => {
    service.getActivityAttachment.mockResolvedValue({
      mimeType: 'application/pdf',
      originalName: 'att.pdf',
      fileContent: Buffer.from('pdf'),
    });
    const res = { setHeader: jest.fn() } as any;
    const result = await controller.downloadActivityAttachment(5, req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('createMessage delegates', () => {
    const dto = { contenido: 'msg' } as any;
    controller.createMessage(3, dto, req);
    expect(service.createMessage).toHaveBeenCalledWith(actor, 3, dto);
  });

  it('statsByGroup delegates', () => {
    controller.statsByGroup(1, req);
    expect(service.statsByGroup).toHaveBeenCalledWith(actor, 1);
  });

  it('statsByStudent delegates', () => {
    controller.statsByStudent(5, req);
    expect(service.statsByStudent).toHaveBeenCalledWith(actor, 5);
  });
});
