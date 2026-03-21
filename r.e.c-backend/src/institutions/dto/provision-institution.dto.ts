import {
  IsArray,
  IsEmail,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInstitutionDto } from './create-institution.dto';

export class ProvisionSecretaryDto {
  @IsString()
  @Length(1, 60)
  nombres: string;

  @IsString()
  @Length(1, 60)
  apellidos: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  documento_identidad: string;

  @IsString()
  @Length(8, 64)
  password: string;
}

export class ProvisionInstitutionDto {
  @ValidateNested()
  @Type(() => CreateInstitutionDto)
  institution: CreateInstitutionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionSecretaryDto)
  secretarias: ProvisionSecretaryDto[];
}
