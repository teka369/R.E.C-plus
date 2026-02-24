import { Body, Controller, Get, Header, Param, ParseIntPipe, Post, Put, UseGuards, Delete } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { UpdateStudentGroupDto } from './dto/update-student-group.dto';
import { AssignGroupDirectorDto } from './dto/assign-group-director.dto';
import type { PromoteGradeDto } from './dto/promote-grade.dto';

@Controller('academic')
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  // Grados
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('grades')
  createGrade(@Body() dto: { nombre: string }) {
    return this.academic.createGrade(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades')
  listGrades() {
    return this.academic.listGrades();
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades/:id')
  getGrade(@Param('id', ParseIntPipe) id: number) {
    return this.academic.getGrade(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Put('grades/:id')
  updateGrade(@Param('id', ParseIntPipe) id: number, @Body() dto: { nombre: string }) {
    return this.academic.updateGrade(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('grades/:id')
  deleteGrade(@Param('id', ParseIntPipe) id: number) {
    return this.academic.deleteGrade(id);
  }

  // Grupos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('groups')
  createGroup(@Body() dto: { nombre: string; gradeId: number }) {
    return this.academic.createGroup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups')
  listGroups() {
    return this.academic.listGroups();
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:id')
  getGroup(@Param('id', ParseIntPipe) id: number) {
    return this.academic.getGroup(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Put('groups/:id')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: { nombre?: string; gradeId?: number }) {
    return this.academic.updateGroup(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('groups/:id')
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.academic.deleteGroup(id);
  }

  // Asignar director a grupo
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Put('groups/:groupId/director')
  assignGroupDirector(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignGroupDirectorDto
  ) {
    return this.academic.assignGroupDirector(groupId, dto.directorId);
  }

  // Materias
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('subjects')
  createSubject(@Body() dto: { nombre: string; codigo?: string }) {
    return this.academic.createSubject(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subjects')
  listSubjects() {
    return this.academic.listSubjects();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subjects/:id')
  getSubject(@Param('id', ParseIntPipe) id: number) {
    return this.academic.getSubject(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Put('subjects/:id')
  updateSubject(@Param('id', ParseIntPipe) id: number, @Body() dto: { nombre?: string; codigo?: string }) {
    return this.academic.updateSubject(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('subjects/:id')
  deleteSubject(@Param('id', ParseIntPipe) id: number) {
    return this.academic.deleteSubject(id);
  }

  // Asignar materia a grupo
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('group-subjects')
  assignSubjectToGroup(@Body() dto: { groupId: number; subjectId: number }) {
    return this.academic.assignSubjectToGroup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/subjects')
  listGroupSubjects(@Param('groupId') groupId: string) {
    return this.academic.listGroupSubjects(Number(groupId));
  }

  // Listar estudiantes de un grupo
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Get('groups/:groupId/students')
  listGroupStudents(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.academic.listGroupStudents(groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('group-subjects/:id')
  deleteGroupSubject(@Param('id', ParseIntPipe) id: number) {
    return this.academic.deleteGroupSubject(id);
  }

  // Asignar estudiante a grupo
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Header('Deprecation', 'true')
  @Header('Sunset', '2026-01-31T00:00:00Z')
  @Header('Link', '</academic/students/:studentId/group>; rel="successor-version"')
  @Post('students/assign-group')
  assignStudentToGroup(@Body() dto: { studentId: number; groupId: number }) {
    return this.academic.assignStudentToGroup(dto);
  }

  // Actualizar grupo del estudiante (RESTful)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Put('students/:studentId/group')
  updateStudentGroup(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateStudentGroupDto
  ) {
    return this.academic.assignStudentToGroup({ studentId, groupId: dto.groupId });
  }

  // Obtener grupo actual del estudiante
  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId/group')
  getStudentGroup(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.academic.getStudentGroup(studentId);
  }

  // Eliminar grupo del estudiante (debe eliminar antes de asignar otro)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('students/:studentId/group')
  deleteStudentGroup(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.academic.deleteStudentGroup(studentId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId/subjects')
  listStudentSubjects(@Param('studentId') studentId: string) {
    return this.academic.listStudentSubjects(Number(studentId));
  }

  // Promoción de grado (SECRETARIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('promotions/grade')
  promoteGrade(@Body() dto: PromoteGradeDto) {
    return this.academic.promoteGrade(dto as any);
  }

  // Simulación de promoción de grado (SECRETARIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('promotions/grade/preview')
  previewPromoteGrade(@Body() dto: PromoteGradeDto) {
    return this.academic.previewPromoteGrade(dto as any);
  }

  // Asignar profesor a grupo/materia
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('teachers/assign')
  assignTeacher(@Body() dto: { teacherId: number; groupId: number; subjectId: number }) {
    return this.academic.assignTeacher(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('teachers/:teacherId/assignments')
  listTeacherAssignments(@Param('teacherId') teacherId: string) {
    return this.academic.listTeacherAssignments(Number(teacherId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete('teachers/assignments/:id')
  deleteTeacherAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.academic.deleteTeacherAssignment(id);
  }
}
