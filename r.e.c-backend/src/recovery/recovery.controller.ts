import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { RecoveryService } from './recovery.service';
import {
  CreateRecoveryActivityDto,
  CreateRecoveryMessageDto,
  CreateRecoveryRequestDto,
  UpdateRecoveryActivityDto,
  UpdateRecoveryRequestStatusDto,
} from './dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

@Controller('recovery')
@ApiTags('Recovery')
@ApiBearerAuth()
export class RecoveryController {
  constructor(private readonly recovery: RecoveryService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE)
  @Post('requests')
  createRequest(
    @Body() dto: CreateRecoveryRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.createRequest(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE)
  @Get('requests/my')
  listMyRequests(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.listMyRequests(req.user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Get('groups/:groupId/requests')
  listGroupRequests(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.listGroupRequests(req.user, groupId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Patch('requests/:id/status')
  updateRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecoveryRequestStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.updateRequestStatus(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests/:id/activities')
  listActivities(
    @Param('id', ParseIntPipe) requestId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.listActivities(req.user, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('requests/:id/activities')
  createActivity(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: CreateRecoveryActivityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.createActivity(req.user, requestId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Patch('activities/:id')
  updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecoveryActivityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.updateActivity(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE, UserRole.PROFESOR, UserRole.SECRETARIA)
  @Delete('requests/:id')
  deleteRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.deleteRequest(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Delete('activities/:id')
  deleteActivity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.deleteActivity(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests/:id/messages')
  listMessages(
    @Param('id', ParseIntPipe) requestId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.listMessages(req.user, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('activities/:id/attachment')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  uploadActivityAttachment(
    @Param('id', ParseIntPipe) activityId: number,
    @UploadedFile()
    file: { originalname: string; mimetype: string; buffer: Buffer },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.uploadActivityAttachment(req.user, activityId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activities/:id/attachment')
  async downloadActivityAttachment(
    @Param('id', ParseIntPipe) activityId: number,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.recovery.getActivityAttachment(
      req.user,
      activityId,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`,
    );
    return new StreamableFile(file.fileContent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/messages')
  createMessage(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: CreateRecoveryMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.createMessage(req.user, requestId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Get('stats/groups/:groupId')
  statsByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.statsByGroup(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/students/:studentId')
  statsByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recovery.statsByStudent(req.user, studentId);
  }
}
