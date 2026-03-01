import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertGradePerformanceDto {
  @IsOptional()
  @IsNumber()
  promedioGeneral?: number;

  @IsOptional()
  @IsNumber()
  asistenciaPromedio?: number;

  @IsOptional()
  @IsNumber()
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
