import { StreamableFile } from '@nestjs/common';
import { RecoverySettingsController } from '../../../src/recovery-settings/recovery-settings.controller';
import { RecoverySettingsService } from '../../../src/recovery-settings/recovery-settings.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('RecoverySettingsController', () => {
  let controller: RecoverySettingsController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.SECRETARIA, institutionId: 1 };
  const req = { user: actor } as any;

  beforeEach(() => {
    service = {
      getPeriod: jest.fn(),
      setPeriod: jest.fn(),
      getScheduleFile: jest.fn(),
      uploadSchedule: jest.fn(),
    };
    controller = new RecoverySettingsController(
      service as unknown as RecoverySettingsService,
    );
  });

  it('getConfig delegates', () => {
    controller.getConfig(req);
    expect(service.getPeriod).toHaveBeenCalledWith(actor);
  });

  it('setConfig delegates', () => {
    const dto = { startAt: '2026-01-01', endAt: '2026-06-30' };
    controller.setConfig(dto, req);
    expect(service.setPeriod).toHaveBeenCalledWith(
      actor,
      '2026-01-01',
      '2026-06-30',
    );
  });

  it('getSchedule delegates and returns StreamableFile', async () => {
    service.getScheduleFile.mockResolvedValue({
      mimeType: 'application/pdf',
      originalName: 'schedule.pdf',
      fileContent: Buffer.from('pdf'),
    });
    const res = { setHeader: jest.fn() } as any;
    const result = await controller.getSchedule(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'inline; filename="schedule.pdf"',
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('uploadSchedule delegates', () => {
    const file = {
      originalname: 'h.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from(''),
    };
    controller.uploadSchedule(file, req);
    expect(service.uploadSchedule).toHaveBeenCalledWith(actor, file);
  });
});
