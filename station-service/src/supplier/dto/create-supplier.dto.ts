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
import { NoHtml } from '../../common/validators/index.js';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Nom du fournisseur',
    example: 'Afriquia SMDC',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @NoHtml()
  name!: string;

  @ApiPropertyOptional({
    description: 'Nom du contact',
    example: 'Mohammed Alami',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @NoHtml()
  contactName?: string;

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
    example: 'contact@afriquia.ma',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Adresse du fournisseur',
    example: '123 Zone Industrielle, Casablanca',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @NoHtml()
  address?: string;

  @ApiPropertyOptional({
    description: 'ICE fournisseur (15 chiffres)',
    example: '009876543000012',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.ICE, { message: MOROCCAN_REGEX.ICE_MESSAGE })
  ice?: string;

  @ApiPropertyOptional({
    description: 'IF fournisseur (8 chiffres)',
    example: '87654321',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.TAX_ID, { message: MOROCCAN_REGEX.TAX_ID_MESSAGE })
  taxId?: string;
}
