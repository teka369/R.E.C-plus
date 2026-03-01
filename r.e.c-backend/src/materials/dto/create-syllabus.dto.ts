import { IsInt, IsOptional, IsString, Length } from 'class-validator';

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
  @Length(0, 10000)
  content?: string;
}
