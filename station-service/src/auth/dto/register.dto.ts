import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  // Obligatoire pour GESTIONNAIRE/SUPER_ADMIN, optionnel pour POMPISTE
  @IsOptional()
  @IsEmail()
  email?: string;

  // Obligatoire pour GESTIONNAIRE/SUPER_ADMIN, optionnel pour POMPISTE
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre',
  })
  password?: string;

  // Obligatoire pour POMPISTE, optionnel pour les autres
  @IsOptional()
  @IsString()
  @MinLength(2)
  badgeCode?: string;

  // Obligatoire pour POMPISTE, optionnel pour les autres
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'Le code PIN doit contenir exactement 6 chiffres',
  })
  pinCode?: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
