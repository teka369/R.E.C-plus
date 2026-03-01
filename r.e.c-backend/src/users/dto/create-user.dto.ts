import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  Matches,
  ValidateIf,
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
  @Matches(/@iejavieralondonobarriosevilla\.edu\.co$/, {
    message:
      'El email debe ser del dominio institucional @iejavieralondonobarriosevilla.edu.co',
  })
  email: string;

  @IsString()
  @Length(6, 20)
  documento_identidad: string;

  // Teléfono es requerido solo para profesores
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.PROFESOR)
  @IsString()
  @Length(10, 15)
  telefono?: string;

  // Password es opcional en creación (se auto-genera para estudiantes)
  @IsOptional()
  @IsString()
  @Length(6, 50)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // por defecto ESTUDIANTE en Prisma
}
