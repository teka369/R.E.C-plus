import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './dto/user-role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQuery } from '../common/dto/pagination.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
    email: string;
    institutionId?: number | null;
  };
};

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.create(req.user, dto);
  }

  // Registro masivo de usuarios (SECRETARIA) — máximo 200 por request
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('bulk')
  bulkCreate(@Body() dtos: CreateUserDto[], @Req() req: AuthenticatedRequest) {
    if (!Array.isArray(dtos) || dtos.length === 0) {
      throw new BadRequestException(
        'Se requiere un arreglo con al menos 1 usuario',
      );
    }
    if (dtos.length > 200) {
      throw new BadRequestException('Máximo 200 usuarios por solicitud');
    }
    return this.usersService.bulkCreate(req.user, dtos);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('role') role: UserRole | undefined,
    @Query('institutionId') institutionId: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const pagination: PaginationQuery = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return this.usersService.findAll(
      req.user,
      role,
      institutionId ? Number(institutionId) : undefined,
      pagination,
    );
  }

  // Obtener perfil del usuario actual (DEBE estar antes de /:id)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new ForbiddenException('No autorizado: identidad no válida');
    }
    return this.usersService.findOne(req.user, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const actor = req.user;
    // If non-admin user, verify they are looking up their own profile
    if (
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      const self = await this.usersService.findOne(actor, actor.userId);
      if (!self || self.publicId !== id) {
        throw new ForbiddenException('No autorizado');
      }
    }
    return this.usersService.findOneByPublicId(actor, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateByPublicId(req.user, id, dto);
  }

  // Actualizar perfil del usuario actual (DEBE estar antes de cambiar contraseña de otros)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(req.user, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.removeByPublicId(req.user, id);
  }

  // Cambiar contraseña: permitido para el propio usuario (requiere currentPassword)
  // SECRETARIA puede cambiar contraseña de cualquier usuario sin currentPassword
  @UseGuards(JwtAuthGuard)
  @Patch(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actor = req.user;

    if (
      (actor.role === UserRole.SECRETARIA ||
        actor.role === UserRole.SUPER_ADMIN) &&
      dto.newPassword
    ) {
      // Cambio administrativo sin requerir currentPassword
      await this.usersService.findOneByPublicId(actor, id);
      return this.usersService.changePasswordByPublicId(id, dto.newPassword);
    }

    // Verify the publicId belongs to the current user
    const self = await this.usersService.findOne(actor, actor.userId);
    if (!self || self.publicId !== id) {
      throw new ForbiddenException('No autorizado');
    }

    if (!dto.currentPassword) {
      throw new ForbiddenException('La contraseña actual es requerida');
    }

    return this.usersService.changePasswordWithValidationByPublicId(
      id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
