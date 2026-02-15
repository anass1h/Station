import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { VALIDATION_LIMITS } from '../../common/constants/index.js';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsNotEmpty({ message: 'Le mot de passe actuel est obligatoire' })
  @IsString()
  @MaxLength(VALIDATION_LIMITS.PASSWORD_MAX)
  currentPassword!: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 caractère spécial)',
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est obligatoire' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(VALIDATION_LIMITS.PASSWORD_MAX)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial',
    },
  )
  newPassword!: string;
}
