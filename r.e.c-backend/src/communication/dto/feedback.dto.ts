import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

class FeedbackPointsDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  items: string[] = [];
}

export class CreateFeedbackDto {
  @IsInt()
  teacherId: number;

  @IsInt()
  studentId: number;

  @IsInt()
  groupId: number;

  @IsOptional()
  @IsInt()
  subjectId?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackPointsDto)
  strengths?: FeedbackPointsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackPointsDto)
  improvements?: FeedbackPointsDto;
}

export class ListStudentFeedbackQueryDto {
  @IsInt()
  studentId: number;
}