import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import type { StringValue } from 'ms';
// ConfigModule no usado para evitar conflictos de versiones

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.register({
      global: true,
      secret: (() => {
        const s = process.env.JWT_SECRET;
        if (!s) throw new Error('JWT_SECRET no está definido');
        return s;
      })(),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES ?? '7d') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
