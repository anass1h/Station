import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePinDto {
  @ApiProperty({ description: 'Nouveau code PIN (6 chiffres)' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Le PIN doit contenir exactement 6 chiffres' })
  newPin!: string;
}
