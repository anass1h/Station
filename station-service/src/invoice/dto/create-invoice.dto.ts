import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '@prisma/client';
import { InvoiceLineDto } from './invoice-line.dto';
import { SafeText } from '../../common/validators/index.js';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID de la station',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stationId!: string;

  @ApiPropertyOptional({
    description: 'ID du client (null si B2C anonyme)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    description: 'Type de facture',
    enum: InvoiceType,
    example: InvoiceType.B2B,
  })
  @IsEnum(InvoiceType)
  invoiceType!: InvoiceType;

  @ApiProperty({
    description: 'Lignes de facture',
    type: [InvoiceLineDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];

  @ApiPropertyOptional({
    description: 'Début de la période facturée',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Fin de la période facturée',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({
    description: 'Notes sur la facture',
    example: 'Facture mensuelle de carburant',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SafeText()
  notes?: string;
}
