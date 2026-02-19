import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SafeText } from '../../common/validators/index.js';

export class ValidateShiftDto {
  @ApiPropertyOptional({
    description: 'Note de validation du gestionnaire',
    example: 'Shift validé après vérification de la caisse',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SafeText()
  validationNote?: string;
}
