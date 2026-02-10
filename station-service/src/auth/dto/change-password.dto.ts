import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min 8 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
