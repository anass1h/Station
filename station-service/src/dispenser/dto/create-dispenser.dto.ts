import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDispenserDto {
  @ApiProperty({
    description: 'ID de la station',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stationId!: string;

  @ApiProperty({
    description: 'Référence unique du distributeur dans la station',
    example: 'DC-01',
  })
  @IsString()
  @MinLength(1)
  reference!: string;
}
