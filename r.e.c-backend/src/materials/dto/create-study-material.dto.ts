import { IsEnum, IsInt, IsOptional, IsString, Length, IsUrl } from 'class-validator';

export class CreateStudyMaterialDto {
  @IsInt()
  subjectId: number;

  @IsInt()
  groupId: number;

  @IsString()
  @Length(1, 120)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsEnum(['PDF', 'VIDEO', 'LINK', 'DOC', 'OTHER'] as any)
  type: 'PDF' | 'VIDEO' | 'LINK' | 'DOC' | 'OTHER';

  @IsOptional()
  @IsUrl({ require_tld: false })
  resourceUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsEnum(['GROUP', 'GRADE'] as any)
  visibility: 'GROUP' | 'GRADE';
}
