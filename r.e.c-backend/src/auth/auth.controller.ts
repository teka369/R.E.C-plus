import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RecoverByCodeDto } from './dto/recover-by-code.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { resolveLoginTrackerFromRequest } from './login-tracker.util';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const tracker = resolveLoginTrackerFromRequest(req);
    return this.auth.login(dto.email, dto.password, tracker);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.auth.logout(dto.refresh_token);
    return { success: true };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 300_000, limit: 3 } }) // 3 solicitudes por 5 minutos
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return {
      message:
        'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  @Post('recover-by-code')
  @Throttle({ default: { ttl: 300_000, limit: 3 } }) // 3 intentos por 5 minutos
  async recoverByCode(@Body() dto: RecoverByCodeDto) {
    const token = await this.auth.recoverByCode(dto.codigo);
    return { token: token ?? null };
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 300_000, limit: 5 } }) // 5 intentos por 5 minutos
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}
