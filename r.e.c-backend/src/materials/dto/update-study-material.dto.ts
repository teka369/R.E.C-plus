import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsUrl,
  Matches,
} from 'class-validator';
import {
  StudyMaterialType,
  StudyMaterialVisibility,
} from './create-study-material.dto';

export class UpdateStudyMaterialDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsEnum(StudyMaterialType)
  type?: StudyMaterialType;

  @IsOptional()
  @IsUrl({ require_tld: false })
  resourceUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/i, {
    message: 'imageUrl debe ser una URL http(s) o data:image/*',
  })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsEnum(StudyMaterialVisibility)
  visibility?: StudyMaterialVisibility;
}
