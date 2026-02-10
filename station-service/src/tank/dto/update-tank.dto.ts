import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTankDto {
  @ApiPropertyOptional({
    description: 'Référence unique de la cuve dans la station',
    example: 'CUVE-001',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Capacité totale en litres',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Niveau actuel en litres',
    example: 25000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentLevel?: number;

  @ApiPropertyOptional({
    description: "Seuil d'alerte bas en litres",
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowThreshold?: number;
}
