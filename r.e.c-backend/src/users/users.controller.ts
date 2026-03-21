import {
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

  // Registro masivo de usuarios (SECRETARIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Post('bulk')
  bulkCreate(@Body() dtos: CreateUserDto[], @Req() req: AuthenticatedRequest) {
    // Acepta un arreglo de CreateUserDto y retorna resumen de creación
    return this.usersService.bulkCreate(req.user, dtos);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('role') role: UserRole | undefined,
    @Query('institutionId') institutionId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.findAll(
      req.user,
      role,
      institutionId ? Number(institutionId) : undefined,
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
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const requestedId = Number(id);
    const actor = req.user;
    if (
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN &&
      actor.userId !== requestedId
    ) {
      throw new ForbiddenException('No autorizado');
    }
    return this.usersService.findOne(actor, requestedId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(req.user, Number(id), dto);
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
    return this.usersService.remove(req.user, Number(id));
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
    const userId = Number(id);
    const actor = req.user; // { userId, role, email }

    if (
      (actor.role === UserRole.SECRETARIA ||
        actor.role === UserRole.SUPER_ADMIN) &&
      dto.newPassword
    ) {
      // Cambio administrativo sin requerir currentPassword
      await this.usersService.findOne(actor, userId);
      return this.usersService.changePassword(userId, dto.newPassword);
    }

    if (actor.userId !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    if (!dto.currentPassword) {
      throw new ForbiddenException('La contraseña actual es requerida');
    }

    return this.usersService.changePasswordWithValidation(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
