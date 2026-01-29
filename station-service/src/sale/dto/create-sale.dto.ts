import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalePaymentDto } from './sale-payment.dto';

export class CreateSaleDto {
  @ApiProperty({
    description: 'ID du shift en cours',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  shiftId!: string;

  @ApiProperty({
    description: 'ID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  fuelTypeId!: string;

  @ApiPropertyOptional({
    description: 'ID du client (null si vente B2C anonyme)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    description: 'Quantité vendue en litres',
    example: 50,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Liste des paiements pour cette vente',
    type: [SalePaymentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments!: SalePaymentDto[];
}
