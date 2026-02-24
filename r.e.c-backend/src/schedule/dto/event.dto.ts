import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateScheduleEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startAt!: string; // ISO string

  @IsDateString()
  endAt!: string; // ISO string

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateScheduleEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  location?: string;
}