import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';

export class PaymentDetailDto {
  @ApiProperty({
    description: 'ID du moyen de paiement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  paymentMethodId!: string;

  @ApiProperty({
    description: 'Montant déclaré pour ce moyen de paiement (MAD)',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  actualAmount!: number;

  @ApiPropertyOptional({
    description: 'Référence (N° bordereau CB, etc.)',
    example: 'BORD-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @NoHtml()
  reference?: string;
}
