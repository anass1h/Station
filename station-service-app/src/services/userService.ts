import { axiosInstance } from './api';

export type UserRole = 'SUPER_ADMIN' | 'GESTIONNAIRE' | 'POMPISTE';

export interface User {
  id: string;
  stationId: string | null;
  role: UserRole;
  badgeCode: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station?: {
    id: string;
    name: string;
  };
  totalDebt?: number;
}

export interface CreateUserDto {
  stationId?: string;
  role: UserRole;
  badgeCode?: string;
  pin?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'stationId' | 'role'>> {
  isActive?: boolean;
}

export const userService = {
  async getAll(filters?: { stationId?: string; role?: UserRole }): Promise<User[]> {
    const response = await axiosInstance.get('/users', { params: filters });
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  async getPompistes(stationId: string): Promise<User[]> {
    const response = await axiosInstance.get('/users', {
      params: { stationId, role: 'POMPISTE' },
    });
    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  async resetPin(id: string, newPin: string): Promise<void> {
    await axiosInstance.patch(`/users/${id}/reset-pin`, { pin: newPin });
  },

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const response = await axiosInstance.patch(`/users/${id}`, { isActive });
    return response.data;
  },

  generateBadgeCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  async getGestionnaires(stationId?: string): Promise<User[]> {
    const params: { stationId?: string; role: UserRole } = { role: 'GESTIONNAIRE' };
    if (stationId) params.stationId = stationId;
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  },

  async getActivePompistes(stationId: string): Promise<User[]> {
    const response = await axiosInstance.get('/users', {
      params: { stationId, role: 'POMPISTE', isActive: true },
    });
    return response.data;
  },

  async checkBadgeCodeAvailable(badgeCode: string): Promise<boolean> {
    // Backend doesn't have this endpoint - check by fetching all users
    // This is not optimal but works for now
    try {
      const users = await userService.getAll();
      return !users.some(u => u.badgeCode === badgeCode);
    } catch {
      return true; // Assume available if we can't check
    }
  },

  async unlockAccount(userId: string): Promise<void> {
    await axiosInstance.post(`/auth/unlock-account/${userId}`);
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await axiosInstance.post('/auth/change-password', data);
  },

  async updatePin(newPin: string): Promise<void> {
    await axiosInstance.post('/auth/change-pin', { newPin });
  },
};
