import {
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
  @MaxLength(200)
  tendenciaGeneral?: string;
}
