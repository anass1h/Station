import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SafeText } from '../../common/validators/index.js';
import { Type } from 'class-transformer';
import { PaymentDetailDto } from './payment-detail.dto';

export class CloseCashRegisterDto {
  @ApiProperty({
    description: 'ID du shift à clôturer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  shiftId!: string;

  @ApiProperty({
    description: 'Détails des montants déclarés par moyen de paiement',
    type: [PaymentDetailDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  details!: PaymentDetailDto[];

  @ApiPropertyOptional({
    description: "Note explicative en cas d'écart",
    example: 'Écart dû à un rendu de monnaie incorrect',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SafeText()
  varianceNote?: string;

  @ApiPropertyOptional({
    description:
      "Créer automatiquement une dette si variance négative (manque d'argent)",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  createDebtOnNegativeVariance?: boolean = true;
}
