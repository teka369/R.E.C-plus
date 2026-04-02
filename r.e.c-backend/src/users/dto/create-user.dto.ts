import {
  IsEmail,
  IsInt,
  Min,
  IsOptional,
  IsString,
  Length,
  IsEnum,
} from 'class-validator';
import { UserRole } from './user-role.enum';

export class CreateUserDto {
  @IsString()
  @Length(1, 50)
  nombres: string;

  @IsString()
  @Length(1, 50)
  apellidos: string;

  @IsEmail()
  email: string;

  // Password es opcional en creación (se auto-genera si no se proporciona)
  @IsOptional()
  @IsString()
  @Length(6, 50)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // por defecto ESTUDIANTE en Prisma

  @IsOptional()
  @IsInt()
  @Min(1)
  institutionId?: number;
}
