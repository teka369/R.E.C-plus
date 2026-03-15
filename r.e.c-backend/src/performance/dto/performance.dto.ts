import {
  IsInt,
  Max,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpsertGradePerformanceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  promedioGeneral?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  asistenciaPromedio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aprobacion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mejorAsignatura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  estudiantesDestacados?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inasistenciasJustificadas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inasistenciasInjustificadas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeCursoMayorAsistencia?: number;

  @IsOptional()
  @IsNumber()
  variacionPromedio?: number;

  @IsOptional()
  @IsNumber()
  variacionAprobacion?: number;

  @IsOptional()
  @IsNumber()
  reduccionAusencias?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tendenciaGeneral?: string;
}
