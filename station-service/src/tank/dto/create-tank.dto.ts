import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTankDto {
  @ApiProperty({
    description: 'ID de la station',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stationId!: string;

  @ApiProperty({
    description: 'ID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  fuelTypeId!: string;

  @ApiProperty({
    description: 'Référence unique de la cuve dans la station',
    example: 'CUVE-001',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  reference!: string;

  @ApiProperty({
    description: 'Capacité totale en litres',
    example: 50000,
  })
  @IsNumber()
  @IsPositive()
  capacity!: number;

  @ApiProperty({
    description: 'Niveau actuel en litres',
    example: 25000,
  })
  @IsNumber()
  @Min(0)
  currentLevel!: number;

  @ApiProperty({
    description: "Seuil d'alerte bas en litres",
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  lowThreshold!: number;
}
