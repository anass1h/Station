import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, LoginCredentials, LoginBadgeCredentials, User } from '@/types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  // Login by email mutation
  const loginByEmail = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });

  // Login by badge mutation
  const loginByBadge = useMutation({
    mutationFn: async (credentials: LoginBadgeCredentials): Promise<AuthResponse> => {
      const response = await axiosInstance.post<AuthResponse>('/auth/login-badge', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });

  // Get current user
  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const response = await axiosInstance.get<User>('/auth/me');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async (): Promise<void> => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });

  return {
    user: currentUser || user,
    isAuthenticated,
    loginByEmail,
    loginByBadge,
    logout,
    refetchUser,
  };
}
