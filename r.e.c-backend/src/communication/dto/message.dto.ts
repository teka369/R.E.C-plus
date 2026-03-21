import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  recipientId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content: string;
}

export class ReadMessageDto {
  @IsInt()
  messageId: number;
}
