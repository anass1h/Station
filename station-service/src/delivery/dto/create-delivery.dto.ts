import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'ID de la cuve de destination',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tankId!: string;

  @ApiProperty({
    description: 'ID du fournisseur',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({
    description: 'Numéro du bon de livraison',
    example: 'BL-2024-001234',
  })
  @IsString()
  @MaxLength(50)
  @NoHtml()
  deliveryNoteNumber!: string;

  @ApiProperty({
    description: 'Quantité livrée en litres',
    example: 20000,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: "Prix d'achat en MAD/litre",
    example: 9.5,
  })
  @IsNumber()
  @IsPositive()
  purchasePrice!: number;

  @ApiProperty({
    description: 'Niveau de jauge avant livraison (litres)',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  levelBefore!: number;

  @ApiProperty({
    description: 'Niveau de jauge après livraison (litres)',
    example: 25000,
  })
  @IsNumber()
  @Min(0)
  levelAfter!: number;

  @ApiPropertyOptional({
    description: 'Température du carburant en °C',
    example: 25.5,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Quantité commandée en litres (pour calcul écart livraison)',
    example: 20000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  orderedQuantity?: number;

  @ApiProperty({
    description: 'Date et heure de livraison (ISO)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  deliveredAt!: string;
}
