import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsNotTrivialPin } from '../../common/validators/pin.validator.js';

export class ChangePinDto {
  @ApiProperty({ description: 'Code PIN actuel (6 chiffres)' })
  @IsNotEmpty({ message: 'Le code PIN actuel est obligatoire' })
  @IsString()
  currentPin!: string;

  @ApiProperty({ description: 'Nouveau code PIN (6 chiffres, pas de code trivial)' })
  @IsNotEmpty({ message: 'Le nouveau code PIN est obligatoire' })
  @IsString()
  @Length(6, 6, { message: 'Le code PIN doit contenir exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le PIN doit contenir exactement 6 chiffres' })
  @IsNotTrivialPin()
  newPin!: string;
}
