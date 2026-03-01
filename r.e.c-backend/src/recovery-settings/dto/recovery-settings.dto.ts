import { IsDateString } from 'class-validator';

export class SetRecoveryPeriodDto {
  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}

export class RecoveryPeriodViewDto {
  active: boolean;
  startAt: string;
  endAt: string;
}
