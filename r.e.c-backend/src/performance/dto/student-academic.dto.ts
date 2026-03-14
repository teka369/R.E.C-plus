import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type GradeEntryJson = { label: string; value: number };

export class UpsertStudentAcademicDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  parcial1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  parcial2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  parcial3?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  parcial4?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  notaFinal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progresoMateria?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inasistenciasJustificadas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inasistenciasInjustificadas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsOptional()
  @IsString()
  gradesJson?: string;
}
