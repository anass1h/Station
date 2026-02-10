import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateNozzleDto {
  @ApiPropertyOptional({
    description: 'ID de la cuve associée',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  tankId?: string;

  @ApiPropertyOptional({
    description: 'ID du type de carburant',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  fuelTypeId?: string;

  @ApiPropertyOptional({
    description: 'Référence unique du pistolet sur le distributeur',
    example: 'DC01-P1',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Position sur le distributeur (1, 2, 3...)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @ApiPropertyOptional({
    description: 'Index compteur actuel en litres',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentIndex?: number;
}
