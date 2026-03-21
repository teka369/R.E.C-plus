import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const SYLLABUS_STATUS = ['BORRADOR', 'ACTIVO', 'ARCHIVADO'] as const;

export class UpdateSyllabusDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

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
