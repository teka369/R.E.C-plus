import { IsNumber, IsPositive } from 'class-validator';

export class UpdateStudentGroupDto {
  @IsNumber()
  @IsPositive()
  groupId: number;
}
