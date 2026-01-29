// User types
export type UserRole = 'POMPISTE' | 'GESTIONNAIRE' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  stationId: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginBadgeCredentials {
  badgeCode: string;
  pinCode: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// Station types
export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fuel type
export interface FuelType {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

// Tank type
export interface Tank {
  id: string;
  stationId: string;
  fuelTypeId: string;
  capacity: number;
  currentLevel: number;
  lowThreshold: number;
  reference: string;
  isActive: boolean;
  fuelType?: FuelType;
}

// Shift types
export type ShiftStatus = 'OPEN' | 'CLOSED' | 'VALIDATED';

export interface Shift {
  id: string;
  nozzleId: string;
  pompisteId: string;
  indexStart: number;
  indexEnd: number | null;
  startedAt: string;
  endedAt: string | null;
  status: ShiftStatus;
  incidentNote: string | null;
}

// Sale type
export interface Sale {
  id: string;
  shiftId: string;
  fuelTypeId: string;
  clientId: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  soldAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
