import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class MetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  promedio_general?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  asistencia?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tareas_completadas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  participacion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  disciplina?: number;
}

export class UpdateGroupInfoDto {
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  highlights?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  links?: string[];
}
