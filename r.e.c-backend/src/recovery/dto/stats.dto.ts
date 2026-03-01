import { IsInt } from 'class-validator';

export class RecoveryStatsByGroupDto {
  @IsInt()
  groupId: number;
}

export class RecoveryStatsByStudentDto {
  @IsInt()
  studentId: number;
}
