import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelInvoiceDto {
  @ApiProperty({
    description: 'Motif d\'annulation',
    example: 'Erreur de facturation - doublon',
  })
  @IsString()
  @MinLength(10)
  reason!: string;
}
