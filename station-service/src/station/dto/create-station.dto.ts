import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MOROCCAN_REGEX, FORMAT_REGEX } from '../../common/constants/index.js';

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
    description: 'Téléphone',
    example: '+212522123456',
  })
  @IsOptional()
  @IsString()
  @Matches(FORMAT_REGEX.PHONE_MA, { message: FORMAT_REGEX.PHONE_MA_MESSAGE })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contact',
    example: 'station@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'ICE (15 chiffres)',
    example: '001234567000012',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.ICE, { message: MOROCCAN_REGEX.ICE_MESSAGE })
  ice?: string;

  @ApiPropertyOptional({
    description: 'IF (8 chiffres)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.TAX_ID, { message: MOROCCAN_REGEX.TAX_ID_MESSAGE })
  taxId?: string;

  @ApiPropertyOptional({
    description: 'RC (1-10 chiffres)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.RC, { message: MOROCCAN_REGEX.RC_MESSAGE })
  rc?: string;

  @ApiPropertyOptional({
    description: 'Patente',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.PATENTE, { message: MOROCCAN_REGEX.PATENTE_MESSAGE })
  patente?: string;
}
