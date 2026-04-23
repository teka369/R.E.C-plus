import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type GradeEntryJson = { label: string; value: number };

export class UpsertStudentAcademicEvaluationDto {
  @IsOptional()
  @IsInt()
  evaluationId?: number;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  termSlot?: 1 | 2 | 3 | 4 | null;

  @IsOptional()
  @IsNumber()
  weight?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  grade?: number | null;
}

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

  // ── v2 (canónico) ───────────────────────────────────────────────────────────

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertStudentAcademicEvaluationDto)
  evaluations?: UpsertStudentAcademicEvaluationDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  finalOverride?: number | null;
}
