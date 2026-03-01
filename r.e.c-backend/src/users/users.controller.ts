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
  };
};

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // Registro masivo de usuarios (SECRETARIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Post('bulk')
  bulkCreate(@Body() dtos: CreateUserDto[]) {
    // Acepta un arreglo de CreateUserDto y retorna resumen de creación
    return this.usersService.bulkCreate(dtos);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Get()
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const requestedId = Number(id);
    const actor = req.user;
    if (actor.role !== UserRole.SECRETARIA && actor.userId !== requestedId) {
      throw new ForbiddenException('No autorizado');
    }
    return this.usersService.findOne(requestedId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
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

    if (actor.role === UserRole.SECRETARIA && dto.newPassword) {
      // Cambio administrativo sin requerir currentPassword
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
