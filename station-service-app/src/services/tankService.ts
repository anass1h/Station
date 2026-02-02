import { axiosInstance } from './api';

export interface Tank {
  id: string;
  stationId: string;
  fuelTypeId: string;
  reference: string;
  capacity: number;
  currentLevel: number;
  lowThreshold: number; // Backend field name
  alertThreshold?: number; // Frontend alias
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fuelType?: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
  station?: {
    id: string;
    name: string;
  };
}

export interface CreateTankDto {
  stationId: string;
  fuelTypeId: string;
  reference: string;
  capacity: number;
  currentLevel?: number;
  lowThreshold?: number;
}

export interface UpdateTankDto extends Partial<Omit<CreateTankDto, 'stationId'>> {
  isActive?: boolean;
}

export const tankService = {
  async getAll(stationId?: string): Promise<Tank[]> {
    const params = stationId ? { stationId } : {};
    const response = await axiosInstance.get('/tanks', { params });
    return response.data;
  },

  async getById(id: string): Promise<Tank> {
    const response = await axiosInstance.get(`/tanks/${id}`);
    return response.data;
  },

  async getByStation(stationId: string): Promise<Tank[]> {
    const response = await axiosInstance.get('/tanks', { params: { stationId } });
    return response.data;
  },

  async create(data: CreateTankDto): Promise<Tank> {
    const response = await axiosInstance.post('/tanks', data);
    return response.data;
  },

  async update(id: string, data: UpdateTankDto): Promise<Tank> {
    const response = await axiosInstance.patch(`/tanks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/tanks/${id}`);
  },

  async updateLevel(id: string, level: number): Promise<Tank> {
    // Use the standard update endpoint with currentLevel
    const response = await axiosInstance.patch(`/tanks/${id}`, { currentLevel: level });
    return response.data;
  },
};
