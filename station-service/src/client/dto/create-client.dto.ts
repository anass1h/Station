import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ClientType } from '@prisma/client';
import { MOROCCAN_REGEX, FORMAT_REGEX } from '../../common/constants/index.js';
import { RequireForB2B, NoHtml } from '../../common/validators/index.js';

export class CreateClientDto {
  @ApiProperty({
    description: 'ID de la station',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stationId!: string;

  @ApiProperty({
    description: 'Type de client',
    enum: ClientType,
    example: ClientType.B2B,
  })
  @IsEnum(ClientType)
  clientType!: ClientType;

  @ApiPropertyOptional({
    description: "Nom de l'entreprise (obligatoire si B2B)",
    example: 'Transport Express SARL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @NoHtml()
  @RequireForB2B()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Nom du contact',
    example: 'Ahmed Bennani',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @NoHtml()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'ICE (15 chiffres)',
    example: '001234567000089',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.ICE, { message: MOROCCAN_REGEX.ICE_MESSAGE })
  @RequireForB2B()
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
    description: 'RC',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Matches(MOROCCAN_REGEX.RC, { message: MOROCCAN_REGEX.RC_MESSAGE })
  rc?: string;

  @ApiPropertyOptional({
    description: 'Adresse',
    example: '123 Zone Industrielle, Casablanca',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @NoHtml()
  address?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
    example: '+212522123456',
  })
  @IsOptional()
  @IsString()
  @Matches(FORMAT_REGEX.PHONE_MA, { message: FORMAT_REGEX.PHONE_MA_MESSAGE })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email',
    example: 'contact@transport-express.ma',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Plafond de crédit en MAD',
    example: 50000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Délai de paiement en jours',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermDays?: number;
}
