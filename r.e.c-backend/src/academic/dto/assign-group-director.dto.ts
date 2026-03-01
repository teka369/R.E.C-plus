import { IsInt } from 'class-validator';

export class AssignGroupDirectorDto {
  @IsInt()
  directorId: number;
}
