import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { SafeText } from '../../common/validators/index.js';

export class CancelInvoiceDto {
  @ApiProperty({
    description: "Motif d'annulation",
    example: 'Erreur de facturation - doublon',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @SafeText()
  reason!: string;
}
