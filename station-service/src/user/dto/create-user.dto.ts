import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';
import { VALIDATION_LIMITS } from '../../common/constants/index.js';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'ID de la station' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiProperty({ enum: UserRole, description: "Role de l'utilisateur" })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ description: 'Code badge (6 caracteres)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  badgeCode?: string;

  @ApiPropertyOptional({ description: 'Code PIN (6 chiffres)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pin?: string;

  @ApiProperty({ description: 'Prenom' })
  @IsNotEmpty()
  @NoHtml()
  @IsString()
  @MaxLength(VALIDATION_LIMITS.NAME_STANDARD)
  firstName!: string;

  @ApiProperty({ description: 'Nom' })
  @IsNotEmpty()
  @NoHtml()
  @IsString()
  @MaxLength(VALIDATION_LIMITS.NAME_STANDARD)
  lastName!: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telephone' })
  @IsOptional()
  @NoHtml()
  @IsString()
  @MaxLength(VALIDATION_LIMITS.PHONE)
  phone?: string;

  @ApiPropertyOptional({ description: 'Mot de passe (min 8 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(VALIDATION_LIMITS.PASSWORD_MAX)
  password?: string;
}
