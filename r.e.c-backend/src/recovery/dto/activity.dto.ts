import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const RECOVERY_ACTIVITY_TYPES = [
  'HOMEWORK',
  'EXAM',
  'PROJECT',
  'PRACTICE',
] as const;
export const RECOVERY_ACTIVITY_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'SUBMITTED',
  'EVALUATED',
] as const;

export type RecoveryActivityTypeDto = (typeof RECOVERY_ACTIVITY_TYPES)[number];
export type RecoveryActivityStatusDto =
  (typeof RECOVERY_ACTIVITY_STATUSES)[number];

export class CreateRecoveryActivityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description: string;

  @IsIn(RECOVERY_ACTIVITY_TYPES)
  activityType: RecoveryActivityTypeDto;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsDateString()
  dueAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentUrl?: string;
}

export class UpdateRecoveryActivityDto {
  @IsOptional()
  @IsIn(RECOVERY_ACTIVITY_STATUSES)
  status?: RecoveryActivityStatusDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  score?: number;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentUrl?: string;
}
