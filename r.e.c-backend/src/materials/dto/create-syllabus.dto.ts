import { IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';

const SYLLABUS_STATUS = ['BORRADOR', 'ACTIVO', 'ARCHIVADO'] as const;

export class CreateSyllabusDto {
  @IsInt()
  subjectId: number;

  @IsInt()
  groupId: number;

  @IsString()
  @Length(1, 120)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  duration?: string;

  @IsOptional()
  @IsString()
  @IsIn(SYLLABUS_STATUS)
  status?: (typeof SYLLABUS_STATUS)[number];

  @IsOptional()
  @IsString()
  @Length(0, 10000)
  content?: string;
}
