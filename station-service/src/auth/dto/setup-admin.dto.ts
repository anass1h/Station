import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour l'initialisation du premier administrateur du système.
 * Utilisé uniquement via POST /auth/setup quand aucun SUPER_ADMIN n'existe.
 */
export class SetupAdminDto {
  @ApiProperty({ example: 'admin@station.com', description: 'Email du premier administrateur' })
  @IsEmail({}, { message: 'Format email invalide' })
  email!: string;

  @ApiProperty({
    example: 'Admin@123!',
    description: 'Mot de passe (min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 caractère spécial)',
  })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial',
    },
  )
  password!: string;

  @ApiProperty({ example: 'Super', description: 'Prénom' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  firstName!: string;

  @ApiProperty({ example: 'Admin', description: 'Nom' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  lastName!: string;

  @ApiProperty({ required: false, description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  phone?: string;
}
