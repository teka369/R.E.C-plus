import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { UpdateStudentGroupDto } from './dto/update-student-group.dto';
import { AssignGroupDirectorDto } from './dto/assign-group-director.dto';
import type { PromoteGradeDto } from './dto/promote-grade.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

@Controller('academic')
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('grades')
  createGrade(
    @Body() dto: { nombre: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.createGrade(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades')
  listGrades(@Req() req: AuthenticatedRequest) {
    return this.academic.listGrades(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades/:id')
  getGrade(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.getGrade(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('grades/:id')
  updateGrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { nombre: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.updateGrade(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('grades/:id')
  deleteGrade(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteGrade(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('groups')
  createGroup(
    @Body() dto: { nombre: string; gradeId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.createGroup(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups')
  listGroups(@Req() req: AuthenticatedRequest) {
    return this.academic.listGroups(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:id')
  getGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.getGroup(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('groups/:id')
  updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { nombre?: string; gradeId?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.updateGroup(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('groups/:id')
  deleteGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteGroup(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('groups/:groupId/director')
  assignGroupDirector(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignGroupDirectorDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.assignGroupDirector(req.user, groupId, dto.directorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('subjects')
  createSubject(
    @Body() dto: { nombre: string; codigo?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.createSubject(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subjects')
  listSubjects(@Req() req: AuthenticatedRequest) {
    return this.academic.listSubjects(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subjects/:id')
  getSubject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.getSubject(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('subjects/:id')
  updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { nombre?: string; codigo?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.updateSubject(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('subjects/:id')
  deleteSubject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteSubject(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('group-subjects')
  assignSubjectToGroup(
    @Body() dto: { groupId: number; subjectId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.assignSubjectToGroup(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/subjects')
  listGroupSubjects(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listGroupSubjects(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.PROFESOR, UserRole.SUPER_ADMIN)
  @Get('groups/:groupId/students')
  listGroupStudents(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listGroupStudents(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('group-subjects/:id')
  deleteGroupSubject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteGroupSubject(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Header('Deprecation', 'true')
  @Header('Sunset', '2026-01-31T00:00:00Z')
  @Header(
    'Link',
    '</academic/students/:studentId/group>; rel="successor-version"',
  )
  @Post('students/assign-group')
  assignStudentToGroup(
    @Body() dto: { studentId: number; groupId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.assignStudentToGroup(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('students/:studentId/group')
  updateStudentGroup(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateStudentGroupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.assignStudentToGroup(req.user, {
      studentId,
      groupId: dto.groupId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId/group')
  getStudentGroup(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const actor = req.user;
    if (
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN &&
      actor.userId !== studentId
    ) {
      throw new ForbiddenException('No autorizado');
    }
    return this.academic.getStudentGroup(actor, studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('students/:studentId/group')
  deleteStudentGroup(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteStudentGroup(req.user, studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId/subjects')
  listStudentSubjects(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const actor = req.user;
    if (
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN &&
      actor.userId !== studentId
    ) {
      throw new ForbiddenException('No autorizado');
    }
    return this.academic.listStudentSubjects(actor, studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('promotions/grade')
  promoteGrade(@Body() dto: PromoteGradeDto, @Req() req: AuthenticatedRequest) {
    return this.academic.promoteGrade(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('promotions/grade/preview')
  previewPromoteGrade(
    @Body() dto: PromoteGradeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.previewPromoteGrade(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('teachers/assign')
  assignTeacher(
    @Body() dto: { teacherId: number; groupId: number; subjectId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.assignTeacher(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('teachers/:teacherId/assignments')
  listTeacherAssignments(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listTeacherAssignments(req.user, teacherId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('teachers/assignments/:id')
  deleteTeacherAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteTeacherAssignment(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('teachers/:teacherId/offerings')
  listTeacherOfferings(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('periodId') periodId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listTeacherOfferings(
      req.user,
      teacherId,
      periodId ? Number(periodId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('periods')
  listAcademicPeriods(@Req() req: AuthenticatedRequest) {
    return this.academic.listAcademicPeriods(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('periods/active')
  getActivePeriod(@Req() req: AuthenticatedRequest) {
    return this.academic.getActivePeriod(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('periods/:id')
  getAcademicPeriod(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.getAcademicPeriod(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('periods')
  createAcademicPeriod(
    @Body()
    dto: {
      nombre: string;
      codigo: string;
      tipo?: 'TERM' | 'RECOVERY' | 'INTERSESSION';
      fechaInicio: string;
      fechaFin: string;
      fechaCierre?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.createAcademicPeriod(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('periods/:id')
  updateAcademicPeriod(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      nombre?: string;
      codigo?: string;
      tipo?: 'TERM' | 'RECOVERY' | 'INTERSESSION';
      fechaInicio?: string;
      fechaFin?: string;
      fechaCierre?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.updateAcademicPeriod(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('periods/:id/activate')
  activateAcademicPeriod(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.activateAcademicPeriod(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('periods/:id/close')
  closeAcademicPeriod(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.closeAcademicPeriod(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/offerings')
  listGroupOfferings(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('periodId') periodId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listGroupOfferings(
      req.user,
      groupId,
      periodId ? Number(periodId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('offerings/:offeringId')
  getOfferingDetail(
    @Param('offeringId', ParseIntPipe) offeringId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.getOfferingDetail(req.user, offeringId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('offerings/:offeringId/evaluations')
  listEvaluations(
    @Param('offeringId', ParseIntPipe) offeringId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.listEvaluations(req.user, offeringId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('offerings/:offeringId/evaluations')
  createEvaluation(
    @Param('offeringId', ParseIntPipe) offeringId: number,
    @Body()
    dto: {
      titulo: string;
      tipo?: string;
      porcentaje?: number;
      orden?: number;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.createEvaluation(req.user, offeringId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Put('evaluations/:evalId')
  updateEvaluation(
    @Param('evalId', ParseIntPipe) evalId: number,
    @Body()
    dto: {
      titulo?: string;
      tipo?: string;
      porcentaje?: number;
      orden?: number;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.updateEvaluation(req.user, evalId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete('evaluations/:evalId')
  deleteEvaluation(
    @Param('evalId', ParseIntPipe) evalId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academic.deleteEvaluation(req.user, evalId);
  }
}
