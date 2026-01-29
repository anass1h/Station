import { IsString, Length, Matches, MinLength } from 'class-validator';

export class LoginBadgeDto {
  @IsString()
  @MinLength(2)
  badgeCode!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'Le code PIN doit contenir exactement 6 chiffres',
  })
  pinCode!: string;
}
