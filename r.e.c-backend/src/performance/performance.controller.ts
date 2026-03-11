import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { PerformanceService } from './performance.service';
import { UpsertGradePerformanceDto } from './dto/performance.dto';
import { UpsertStudentAcademicDto } from './dto/student-academic.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
  };
};

@Controller('performance')
@ApiTags('Performance')
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}

  @UseGuards(JwtAuthGuard)
  @Get('grades/:grade')
  getByGrade(@Param('grade') grade: string) {
    return this.performance.getByGrade(grade);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId')
  getByGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.performance.getByGroup(groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Post('grades/:grade')
  upsertByGrade(
    @Param('grade') grade: string,
    @Body() dto: UpsertGradePerformanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performance.upsertByGrade(req.user, grade, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId/academic')
  getStudentAcademic(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performance.getStudentAcademic(req.user, studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Get('groups/:groupId/students-academic')
  getGroupAcademicOverview(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performance.getGroupAcademicOverview(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Post('groups/:groupId/students/:studentId/subjects/:subjectId/academic')
  upsertStudentAcademic(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body() dto: UpsertStudentAcademicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performance.upsertStudentAcademic(
      req.user,
      groupId,
      studentId,
      subjectId,
      dto,
    );
  }
}
