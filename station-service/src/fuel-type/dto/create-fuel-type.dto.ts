import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateFuelTypeDto {
  @ApiProperty({
    description: 'Code unique du type de carburant',
    example: 'GASOIL',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code!: string;

  @ApiProperty({
    description: 'Nom du type de carburant',
    example: 'Gasoil 50ppm',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name!: string;
}
