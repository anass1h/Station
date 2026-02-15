import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Code unique du moyen de paiement',
    example: 'CASH',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code!: string;

  @ApiProperty({
    description: 'Nom du moyen de paiement',
    example: 'Espèces',
  })
  @IsString()
  @MaxLength(50)
  @NoHtml()
  name!: string;

  @ApiProperty({
    description: 'Indique si une référence de transaction est requise',
    example: false,
  })
  @IsBoolean()
  requiresReference!: boolean;
}
