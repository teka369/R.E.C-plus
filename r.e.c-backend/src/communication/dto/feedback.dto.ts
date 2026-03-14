import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const TIPOS_VALID = ['POSITIVA', 'NEGATIVA', 'INFORMATIVA', 'SEGUIMIENTO'];
const ESTADOS_VALID = ['PENDIENTE', 'ATENDIDA'];

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
  @IsString()
  @IsIn(TIPOS_VALID)
  tipo?: string;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS_VALID)
  estado?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackPointsDto)
  strengths?: FeedbackPointsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackPointsDto)
  improvements?: FeedbackPointsDto;
}

export class UpdateFeedbackDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(TIPOS_VALID)
  tipo?: string;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS_VALID)
  estado?: string;

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
