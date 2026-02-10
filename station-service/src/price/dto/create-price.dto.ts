import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({
    description: 'UUID de la station',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stationId!: string;

  @ApiProperty({
    description: 'UUID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  fuelTypeId!: string;

  @ApiProperty({ description: 'Prix de vente TTC (MAD/litre)', example: 14.5 })
  @IsNumber()
  @IsPositive()
  sellingPrice!: number;

  @ApiProperty({ description: 'Prix de vente HT (MAD/litre)', example: 12.08 })
  @IsNumber()
  @IsPositive()
  sellingPriceHT!: number;

  @ApiProperty({ description: "Prix d'achat (MAD/litre)", example: 11.0 })
  @IsNumber()
  @IsPositive()
  purchasePrice!: number;

  @ApiProperty({
    description: 'Date de début de validité (ISO)',
    example: '2026-01-24T00:00:00.000Z',
  })
  @IsDateString()
  effectiveFrom!: string;
}
