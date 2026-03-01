import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { SendMessageDto, ReadMessageDto } from './dto/message.dto';
import {
  CreateNotificationDto,
  ReadNotificationDto,
} from './dto/notification.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
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
    return this.service.createFeedback(dto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('feedback/student/:studentId')
  async listFeedbackByStudent(
    @Param('studentId') studentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.listFeedbackByStudent(Number(studentId), {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  // Mensajes
  @UseGuards(JwtAuthGuard)
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.sendMessage(dto, { userId: req.user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/inbox')
  async inbox(@Request() req: AuthenticatedRequest) {
    return this.service.inbox({ userId: req.user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/sent')
  async sent(@Request() req: AuthenticatedRequest) {
    return this.service.sent({ userId: req.user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/read')
  async markMessageRead(
    @Body() dto: ReadMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.markMessageRead(dto.messageId, {
      userId: req.user.userId,
    });
  }

  // Notificaciones
  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async listNotifications(@Request() req: AuthenticatedRequest) {
    return this.service.listNotifications({ userId: req.user.userId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('notifications')
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.createNotification(dto, { role: req.user.role });
  }

  @UseGuards(JwtAuthGuard)
  @Post('notifications/read')
  async markNotificationRead(
    @Body() dto: ReadNotificationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.markNotificationRead(dto.notificationId, {
      userId: req.user.userId,
    });
  }
}
