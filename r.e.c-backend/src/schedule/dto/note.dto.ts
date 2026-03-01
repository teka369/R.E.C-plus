import { IsOptional, IsString } from 'class-validator';

export class CreateScheduleNoteDto {
  @IsString()
  content!: string;
}

export class UpdateScheduleNoteDto {
  @IsOptional()
  @IsString()
  content?: string;
}
