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
  MinLength,
} from 'class-validator';

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
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Nom' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telephone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mot de passe (min 8 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
