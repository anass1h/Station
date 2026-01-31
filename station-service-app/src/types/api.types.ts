export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    stationId?: string;
  };
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams {
  search?: string;
  searchFields?: string[];
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterOperator {
  eq?: string | number | boolean;
  ne?: string | number | boolean;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  in?: (string | number)[];
  notIn?: (string | number)[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: Record<string, {
    status: 'up' | 'down';
    latency?: number;
  }>;
}
