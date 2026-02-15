import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_LIMITS } from '../../common/constants/index.js';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(VALIDATION_LIMITS.PASSWORD_MAX)
  password!: string;
}
