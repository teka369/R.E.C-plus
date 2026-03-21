import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { SendMessageDto, ReadMessageDto } from './dto/message.dto';
import {
  CreateNotificationDto,
  ReadNotificationDto,
} from './dto/notification.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

@Controller('communication')
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  // Feedback
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('feedback')
  async createFeedback(
    @Body() dto: CreateFeedbackDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.createFeedback(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feedback/student/:studentId')
  async listFeedbackByStudent(
    @Param('studentId') studentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.listFeedbackByStudent(Number(studentId), req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Get('feedback/group/:groupId')
  async listFeedbackByGroup(
    @Param('groupId') groupId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.listFeedbackByGroup(Number(groupId), req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Patch('feedback/:id')
  async updateFeedback(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.updateFeedback(Number(id), dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('feedback/:id')
  async deleteFeedback(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.deleteFeedback(Number(id), req.user);
  }

  // Mensajes
  @UseGuards(JwtAuthGuard)
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.sendMessage(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/inbox')
  async inbox(@Request() req: AuthenticatedRequest) {
    return this.service.inbox(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/sent')
  async sent(@Request() req: AuthenticatedRequest) {
    return this.service.sent(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/read')
  async markMessageRead(
    @Body() dto: ReadMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.markMessageRead(dto.messageId, req.user);
  }

  // Notificaciones
  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async listNotifications(@Request() req: AuthenticatedRequest) {
    return this.service.listNotifications(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('notifications')
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.createNotification(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('notifications/read')
  async markNotificationRead(
    @Body() dto: ReadNotificationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.markNotificationRead(dto.notificationId, req.user);
  }
}
