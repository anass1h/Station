import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStationDto {
  @ApiProperty({
    description: 'Nom de la station',
    example: 'Station Total Casablanca',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Adresse complète',
    example: '123 Boulevard Mohammed V',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address!: string;

  @ApiProperty({ description: 'Ville', example: 'Casablanca' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+212 522 123456',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contact',
    example: 'station@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Commun Entreprise (ICE)',
    example: '001234567000012',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ice?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Fiscal (IF)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Registre du Commerce (RC)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rc?: string;

  @ApiPropertyOptional({
    description: 'Numéro de patente',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  patente?: string;
}
