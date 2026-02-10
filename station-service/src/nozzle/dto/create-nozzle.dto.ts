import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNozzleDto {
  @ApiProperty({
    description: 'ID du distributeur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  dispenserId!: string;

  @ApiProperty({
    description: 'ID de la cuve associée',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  tankId!: string;

  @ApiProperty({
    description: 'ID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  fuelTypeId!: string;

  @ApiProperty({
    description: 'Référence unique du pistolet sur le distributeur',
    example: 'DC01-P1',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  reference!: string;

  @ApiProperty({
    description: 'Position sur le distributeur (1, 2, 3...)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  position!: number;

  @ApiProperty({
    description: 'Index compteur actuel en litres',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  currentIndex: number = 0;
}
