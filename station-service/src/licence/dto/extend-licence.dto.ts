import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ExtendLicenceDto {
  @ApiProperty({ description: 'Mois à ajouter' })
  @IsInt()
  @Min(1)
  months!: number;
}
