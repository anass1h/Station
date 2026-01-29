import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Nom du moyen de paiement',
    example: 'Espèces',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Indique si une référence de transaction est requise',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresReference?: boolean;

  @ApiPropertyOptional({
    description: 'Statut actif/inactif',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
