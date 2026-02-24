import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

export class ReadNotificationDto {
  @IsInt()
  notificationId: number;
}