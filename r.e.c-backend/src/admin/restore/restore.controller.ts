import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../users/dto/user-role.enum';
import { RestoreService } from './restore.service';

@Controller('admin/restore')
@ApiTags('Admin – Restore')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class RestoreController {
  constructor(private readonly restoreService: RestoreService) {}

  @Patch('users/:id')
  restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('user', id);
  }

  @Patch('institutions/:id')
  restoreInstitution(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('institution', id);
  }

  @Patch('student-groups/:id')
  restoreStudentGroup(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('studentGroup', id);
  }

  @Patch('academic-offerings/:id')
  restoreAcademicOffering(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('academicOffering', id);
  }

  @Patch('subjects/:id')
  restoreSubject(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('subject', id);
  }

  @Patch('schedule-entries/:id')
  restoreScheduleEntry(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('weeklyScheduleEntry', id);
  }

  @Patch('schedule-notes/:id')
  restoreScheduleNote(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('scheduleNote', id);
  }

  @Patch('schedule-events/:id')
  restoreScheduleEvent(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('scheduleEvent', id);
  }

  @Patch('study-materials/:id')
  restoreStudyMaterial(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('studyMaterial', id);
  }

  @Patch('recovery-requests/:id')
  restoreRecoveryRequest(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('recoveryRequest', id);
  }

  @Patch('notifications/:id')
  restoreNotification(@Param('id', ParseIntPipe) id: number) {
    return this.restoreService.restore('notification', id);
  }
}
