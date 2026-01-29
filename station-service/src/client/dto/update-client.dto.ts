import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ClientType } from '@prisma/client';

export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'Type de client',
    enum: ClientType,
  })
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @ApiPropertyOptional({
    description: 'Nom de l\'entreprise',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Nom du contact',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Commun Entreprise (ICE)',
  })
  @IsOptional()
  @IsString()
  ice?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Fiscal',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Registre de Commerce',
  })
  @IsOptional()
  @IsString()
  rc?: string;

  @ApiPropertyOptional({
    description: 'Adresse',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Plafond de crédit en MAD',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Délai de paiement en jours',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermDays?: number;
}
