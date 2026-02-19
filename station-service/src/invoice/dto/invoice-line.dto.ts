import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SafeText } from '../../common/validators/index.js';

export class InvoiceLineDto {
  @ApiProperty({
    description: 'ID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  fuelTypeId!: string;

  @ApiPropertyOptional({
    description: 'Description de la ligne',
    example: 'Gasoil 50ppm - Période du 01/01 au 15/01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SafeText()
  description?: string;

  @ApiProperty({
    description: 'Quantité en litres',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Prix unitaire HT en MAD/litre',
    example: 9.5,
  })
  @IsNumber()
  @IsPositive()
  unitPriceHT!: number;
}
