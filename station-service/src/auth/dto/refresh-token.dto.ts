import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  refreshToken!: string;
}
