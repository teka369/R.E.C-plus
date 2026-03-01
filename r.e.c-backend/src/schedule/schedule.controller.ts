import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleEntryDto,
  UpdateScheduleEntryDto,
} from './dto/entry.dto';
import { CreateScheduleNoteDto, UpdateScheduleNoteDto } from './dto/note.dto';
import {
  CreateScheduleEventDto,
  UpdateScheduleEventDto,
} from './dto/event.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
  };
};

@Controller('schedule')
@ApiTags('Schedule')
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  // Weekly entries
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/entries')
  listEntries(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.listEntries(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('groups/:groupId/entries')
  createEntry(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateScheduleEntryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.createEntry(req.user, groupId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('entries/:id')
  updateEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleEntryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.updateEntry(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('entries/:id')
  deleteEntry(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.deleteEntry(req.user, id);
  }

  // Notes
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/notes')
  listNotes(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.listNotes(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('groups/:groupId/notes')
  createNote(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateScheduleNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.createNote(req.user, groupId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('notes/:id')
  updateNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.updateNote(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('notes/:id')
  deleteNote(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.deleteNote(req.user, id);
  }

  // Events
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/events')
  listEvents(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
    @Query('startAt') startAt?: string,
    @Query('endAt') endAt?: string,
  ) {
    return this.schedule.listEvents(req.user, groupId, startAt, endAt);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('groups/:groupId/events')
  createEvent(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateScheduleEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.createEvent(req.user, groupId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('events/:id')
  updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.updateEvent(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('events/:id')
  deleteEvent(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedule.deleteEvent(req.user, id);
  }
}
