import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  ValidateBy,
  ValidationArguments,
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
      validate: (value: unknown, args?: ValidationArguments): boolean =>
        typeof value === 'string' &&
        args != null &&
        value === (args.object as ResetPasswordDto).password,
      defaultMessage: () => 'confirmPassword debe coincidir con password',
    },
  })
  confirmPassword!: string;
}
