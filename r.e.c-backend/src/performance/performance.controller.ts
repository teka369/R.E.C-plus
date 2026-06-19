import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { PerformanceService } from './performance.service';
import { PublicIdResolver } from '../common/resolvers/public-id.resolver';
import { UpsertGradePerformanceDto } from './dto/performance.dto';
import { UpsertStudentAcademicDto } from './dto/student-academic.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

@Controller('performance')
@ApiTags('Performance')
@ApiBearerAuth()
export class PerformanceController {
  constructor(
    private readonly performance: PerformanceService,
    private readonly resolver: PublicIdResolver,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('grades/:grade')
  getByGrade(@Param('grade') grade: string, @Req() req: AuthenticatedRequest) {
    return this.performance.getByGrade(req.user, grade);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId')
  async getByGroup(
    @Param('groupId') groupId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const id = await this.resolver.resolveGroup(groupId, req.user);
    return this.performance.getByGroup(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades/:gradeId/ranking')
  async getGradeRanking(
    @Param('gradeId') gradeId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const id = await this.resolver.resolveGrade(gradeId, req.user);
    return this.performance.getGradeRanking(req.user, id);
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
  async getStudentAcademic(
    @Param('studentId') studentId: string,
    @Query('v') v: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const id = await this.resolver.resolveStudent(studentId, req.user);
    const version = v != null ? Number(v) : 1;
    return this.performance.getStudentAcademic(req.user, id, version);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Get('groups/:groupId/students-academic')
  async getGroupAcademicOverview(
    @Param('groupId') groupId: string,
    @Query('v') v: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const id = await this.resolver.resolveGroup(groupId, req.user);
    const version = v != null ? Number(v) : 1;
    return this.performance.getGroupAcademicOverview(req.user, id, version);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Post('groups/:groupId/students/:studentId/subjects/:subjectId/academic')
  async upsertStudentAcademic(
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: UpsertStudentAcademicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const [gid, sid, subjId] = await Promise.all([
      this.resolver.resolveGroup(groupId, req.user),
      this.resolver.resolveStudent(studentId, req.user),
      this.resolver.resolveSubject(subjectId, req.user),
    ]);
    return this.performance.upsertStudentAcademic(
      req.user,
      gid,
      sid,
      subjId,
      dto,
    );
  }
}
