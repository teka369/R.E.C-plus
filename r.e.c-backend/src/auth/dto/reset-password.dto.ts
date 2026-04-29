import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  ValidateBy,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @ValidateBy({
    name: 'matchPassword',
    validator: {
      validate: (value: unknown, args): boolean =>
        typeof value === 'string' &&
        value === (args.object as ResetPasswordDto).password,
      defaultMessage: () => 'confirmPassword debe coincidir con password',
    },
  })
  confirmPassword!: string;
}
