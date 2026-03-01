import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  IsUrl,
} from 'class-validator';

export enum StudyMaterialType {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  DOC = 'DOC',
  OTHER = 'OTHER',
}

export enum StudyMaterialVisibility {
  GROUP = 'GROUP',
  GRADE = 'GRADE',
}

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

  @IsEnum(StudyMaterialType)
  type: StudyMaterialType;

  @IsOptional()
  @IsUrl({ require_tld: false })
  resourceUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsEnum(StudyMaterialVisibility)
  visibility: StudyMaterialVisibility;
}
