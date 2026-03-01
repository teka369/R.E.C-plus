import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RecoveryRequestStatus, RecoveryRequestType } from '@prisma/client';

export class CreateRecoveryRequestDto {
  @IsInt()
  subjectId: number;

  @IsEnum(RecoveryRequestType)
  type: RecoveryRequestType;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason: string;
}

export class UpdateRecoveryRequestStatusDto {
  @IsEnum(RecoveryRequestStatus)
  status: RecoveryRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  teacherComment?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  finalScore?: number;
}
