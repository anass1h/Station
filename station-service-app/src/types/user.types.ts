export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GESTIONNAIRE' | 'POMPISTE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  stationId?: string;
  badgeCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginBadgeCredentials {
  badgeCode: string;
  pinCode: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile extends User {
  station?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  stationId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  role?: UserRole;
  stationId?: string;
  isActive?: boolean;
  search?: string;
}

export interface Pompiste {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stationId: string;
  isActive: boolean;
}
