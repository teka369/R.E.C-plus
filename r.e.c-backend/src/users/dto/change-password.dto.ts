import { IsOptional, IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  @Length(6, 50)
  currentPassword?: string;

  @IsString()
  @Length(6, 50)
  newPassword: string;
}
