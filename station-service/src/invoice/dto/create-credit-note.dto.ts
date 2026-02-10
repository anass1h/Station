import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateCreditNoteDto {
  @ApiProperty({
    description: "Motif de l'avoir (minimum 10 caractères)",
    example: 'Erreur de facturation sur les quantités livrées le 15/01/2026',
  })
  @IsString()
  @MinLength(10)
  reason!: string;

  @ApiPropertyOptional({
    description: 'Montant HT partiel (si avoir partiel). Si non fourni, avoir total.',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  partialAmountHT?: number;
}
