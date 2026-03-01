import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsInt()
  senderId?: number;

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
