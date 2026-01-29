import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ValidateShiftDto {
  @ApiPropertyOptional({
    description: 'Note de validation du gestionnaire',
    example: 'Shift validé après vérification de la caisse',
  })
  @IsOptional()
  @IsString()
  validationNote?: string;
}
