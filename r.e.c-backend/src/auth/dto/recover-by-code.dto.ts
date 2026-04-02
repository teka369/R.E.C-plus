import { IsNotEmpty, IsString } from 'class-validator';

export class RecoverByCodeDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;
}
