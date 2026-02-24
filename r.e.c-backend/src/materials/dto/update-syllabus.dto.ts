import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateSyllabusDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 10000)
  content?: string;
}