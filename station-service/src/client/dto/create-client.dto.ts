import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ClientType } from '@prisma/client';

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
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Nom du contact',
    example: 'Ahmed Bennani',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Commun Entreprise (ICE)',
    example: '001234567000089',
  })
  @IsOptional()
  @IsString()
  ice?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Fiscal',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Registre de Commerce',
    example: 'RC-CASA-123456',
  })
  @IsOptional()
  @IsString()
  rc?: string;

  @ApiPropertyOptional({
    description: 'Adresse',
    example: '123 Zone Industrielle, Casablanca',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
    example: '+212 522 123456',
  })
  @IsOptional()
  @IsString()
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
