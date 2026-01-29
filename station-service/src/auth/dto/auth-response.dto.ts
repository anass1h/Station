import { UserRole } from '@prisma/client';

export interface AuthUserDto {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  stationId: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
  user: AuthUserDto;
}
