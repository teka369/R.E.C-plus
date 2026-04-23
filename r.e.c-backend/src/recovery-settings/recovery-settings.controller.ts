import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { RecoverySettingsService } from './recovery-settings.service';
import { SetRecoveryPeriodDto } from './dto/recovery-settings.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

type UploadedHorarioFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

@Controller('recovery')
@ApiTags('RecoverySettings')
@ApiBearerAuth()
export class RecoverySettingsController {
  constructor(private readonly settings: RecoverySettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('config')
  getConfig(@Req() req: AuthenticatedRequest) {
    return this.settings.getPeriod(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('config')
  setConfig(
    @Body() dto: SetRecoveryPeriodDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.settings.setPeriod(req.user, dto.startAt, dto.endAt);
  }

  @UseGuards(JwtAuthGuard)
  @Get('schedule')
  async getSchedule(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.settings.getScheduleFile(req.user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`,
    );
    return new StreamableFile(file.fileContent);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('schedule')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('horario', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  uploadSchedule(
    @UploadedFile() file: UploadedHorarioFile,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.settings.uploadSchedule(req.user, file);
  }
}
