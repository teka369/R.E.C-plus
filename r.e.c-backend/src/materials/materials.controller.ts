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
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
};

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  // Study Materials
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('study')
  createStudy(
    @Body() dto: CreateStudyMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.createStudyMaterial(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('study/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  uploadStudyFile(
    @UploadedFile()
    file: { originalname: string; mimetype: string; buffer: Buffer },
    @Body('groupId', ParseIntPipe) groupId: number,
    @Body('subjectId', ParseIntPipe) subjectId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.uploadStudyFile(req.user, groupId, subjectId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get('study')
  listStudy(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.listStudyMaterials(req.user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('study/:id')
  getStudy(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.getStudyMaterial(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('study/:id/file')
  async getStudyFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.materials.getStudyFile(req.user, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`,
    );
    return new StreamableFile(file.fileContent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('study/:id/view')
  incrementStudyViews(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.incrementStudyViews(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('study/:id/download')
  incrementStudyDownloads(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.incrementStudyDownloads(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('study/:id')
  updateStudy(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudyMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.updateStudyMaterial(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('study/:id')
  deleteStudy(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.deleteStudyMaterial(req.user, id);
  }

  // Syllabi
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post('syllabi')
  createSyllabus(
    @Body() dto: CreateSyllabusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.createSyllabus(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('syllabi')
  listSyllabi(@Req() req: AuthenticatedRequest) {
    return this.materials.listSyllabi(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('syllabi/:id')
  getSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.getSyllabus(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('syllabi/:id')
  updateSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSyllabusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.updateSyllabus(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Delete('syllabi/:id')
  deleteSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.deleteSyllabus(req.user, id);
  }

  // Group Info (Leagues)
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/info')
  getGroupInfo(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.getGroupInfo(req.user, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Put('groups/:groupId/info')
  updateGroupInfo(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateGroupInfoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.updateGroupInfo(req.user, groupId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('grades/:gradeId/leagues')
  listLeagues(
    @Param('gradeId', ParseIntPipe) gradeId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materials.listGradeLeagues(req.user, gradeId);
  }
}
