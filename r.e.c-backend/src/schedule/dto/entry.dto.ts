import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleEntryDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  startMinutes!: number;

  @IsInt()
  @Min(1)
  endMinutes!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateScheduleEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  startMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  endMinutes?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @IsString()
  location?: string;
}