import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsNotTrivialPin } from '../../common/validators/pin.validator.js';
import { NoHtml } from '../../common/validators/index.js';
import { VALIDATION_LIMITS } from '../../common/constants/index.js';

export class RegisterDto {
  @ApiProperty({
    required: false,
    description: 'Email (obligatoire pour GESTIONNAIRE/SUPER_ADMIN)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email invalide' })
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Mot de passe (min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 caractère spécial)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial (!@#$%...)',
    },
  )
  password?: string;

  @ApiProperty({
    required: false,
    description: 'Code badge (obligatoire pour POMPISTE)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  badgeCode?: string;

  @ApiProperty({
    required: false,
    description: 'Code PIN (6 chiffres, obligatoire pour POMPISTE, pas de code trivial)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Le code PIN doit contenir exactement 6 chiffres' })
  @Matches(/^\d{6}$/, {
    message: 'Le code PIN doit contenir exactement 6 chiffres',
  })
  @IsNotTrivialPin()
  pinCode?: string;

  @ApiProperty({ description: 'Prénom' })
  @NoHtml()
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(VALIDATION_LIMITS.NAME_STANDARD)
  firstName!: string;

  @ApiProperty({ description: 'Nom' })
  @NoHtml()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(VALIDATION_LIMITS.NAME_STANDARD)
  lastName!: string;

  @ApiProperty({ required: false, description: 'Numéro de téléphone' })
  @IsOptional()
  @NoHtml()
  @IsString()
  @MaxLength(VALIDATION_LIMITS.PHONE)
  phone?: string;

  @ApiProperty({ required: false, description: 'UUID de la station' })
  @IsOptional()
  @IsUUID('4', { message: 'stationId doit être un UUID valide' })
  stationId?: string;

  @ApiProperty({ enum: UserRole, description: 'Rôle de l\'utilisateur' })
  @IsEnum(UserRole, { message: 'Rôle invalide' })
  role!: UserRole;
}
