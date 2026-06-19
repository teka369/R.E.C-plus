import { IsIn, IsString, MinLength } from 'class-validator';

export class SavePushTokenDto {
  @IsString()
  @MinLength(10)
  token: string;

  @IsString()
  @IsIn(['android', 'ios'])
  platform: string;
}
