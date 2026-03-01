import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum NotificationTypeDto {
  GENERAL = 'GENERAL',
  MATERIAL = 'MATERIAL',
  PERFORMANCE = 'PERFORMANCE',
  SCHEDULE = 'SCHEDULE',
  MESSAGE = 'MESSAGE',
  FEEDBACK = 'FEEDBACK',
}

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
  @IsEnum(NotificationTypeDto)
  type?: NotificationTypeDto;
}

export class ReadNotificationDto {
  @IsInt()
  notificationId: number;
}
