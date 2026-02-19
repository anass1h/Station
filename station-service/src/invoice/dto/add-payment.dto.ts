import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NoHtml, SafeText } from '../../common/validators/index.js';

export class AddPaymentDto {
  @ApiProperty({
    description: 'ID du moyen de paiement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  paymentMethodId!: string;

  @ApiProperty({
    description: 'Montant du paiement en MAD',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Référence du paiement (N° chèque, virement...)',
    example: 'CHQ-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @NoHtml()
  reference?: string;

  @ApiProperty({
    description: 'Date du paiement',
    example: '2024-01-15',
  })
  @IsDateString()
  paymentDate!: string;

  @ApiPropertyOptional({
    description: 'Notes sur le paiement',
    example: 'Paiement partiel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SafeText()
  notes?: string;
}
