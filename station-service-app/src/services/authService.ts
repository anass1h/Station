import { axiosInstance } from './api';
import type { LoginCredentials, LoginBadgeCredentials, AuthResponse, User } from '@/types';

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Login with badge code and PIN
   */
  loginByBadge: async (credentials: LoginBadgeCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login-badge', credentials);
    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },
};

export default authService;
