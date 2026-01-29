import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class SalePaymentDto {
  @ApiProperty({
    description: 'ID du moyen de paiement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  paymentMethodId!: string;

  @ApiProperty({
    description: 'Montant payé via ce moyen (MAD)',
    example: 500,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Référence de paiement (N° transaction CB, N° bon, etc.)',
    example: 'TRX-123456',
  })
  @IsOptional()
  @IsString()
  reference?: string;
}
