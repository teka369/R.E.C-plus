import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  @Length(2, 120)
  nombre: string;

  @IsString()
  @Length(2, 60)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @IsOptional()
  @IsString()
  @Length(2, 30)
  codigo?: string;

  @IsOptional()
  @IsString()
  @Length(4, 120)
  dominio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;
}
