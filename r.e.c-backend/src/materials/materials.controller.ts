import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { CreateStudyMaterialDto } from './dto/create-study-material.dto';
import { UpdateStudyMaterialDto } from './dto/update-study-material.dto';
import { CreateSyllabusDto } from './dto/create-syllabus.dto';
import { UpdateSyllabusDto } from './dto/update-syllabus.dto';
import { UpdateGroupInfoDto } from './dto/update-group-info.dto';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  // Study Materials
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('study')
  createStudy(@Body() dto: CreateStudyMaterialDto, @Req() req: any) {
    return this.materials.createStudyMaterial(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('study')
  listStudy(@Req() req: any) {
    return this.materials.listStudyMaterials(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('study/:id')
  getStudy(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.materials.getStudyMaterial(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('study/:id')
  updateStudy(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudyMaterialDto,
    @Req() req: any,
  ) {
    return this.materials.updateStudyMaterial(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('study/:id')
  deleteStudy(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.materials.deleteStudyMaterial(req.user, id);
  }

  // Syllabi
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('syllabi')
  createSyllabus(@Body() dto: CreateSyllabusDto, @Req() req: any) {
    return this.materials.createSyllabus(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('syllabi')
  listSyllabi(@Req() req: any) {
    return this.materials.listSyllabi(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('syllabi/:id')
  getSyllabus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.materials.getSyllabus(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('syllabi/:id')
  updateSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSyllabusDto,
    @Req() req: any,
  ) {
    return this.materials.updateSyllabus(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('syllabi/:id')
  deleteSyllabus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.materials.deleteSyllabus(req.user, id);
  }

  // Group Info (Leagues)
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/info')
  getGroupInfo(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.materials.getGroupInfo(groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('groups/:groupId/info')
  updateGroupInfo(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateGroupInfoDto,
    @Req() req: any,
  ) {
    return this.materials.updateGroupInfo(req.user, groupId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades/:gradeId/leagues')
  listLeagues(@Param('gradeId', ParseIntPipe) gradeId: number) {
    return this.materials.listGradeLeagues(gradeId);
  }
}
