import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { GradingMode } from '@prisma/client';

export class UpdateGradingPolicyDto {
  @IsEnum(GradingMode)
  gradingMode: GradingMode;

  @IsOptional()
  @IsObject()
  competencyWeights?: Record<string, number>;
}
