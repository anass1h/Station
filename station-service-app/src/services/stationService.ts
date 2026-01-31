import { axiosInstance } from './api';

export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  ice: string | null;
  iff: string | null;
  rc: string | null;
  patente: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStationDto {
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  ice?: string;
  iff?: string;
  rc?: string;
  patente?: string;
}

export interface UpdateStationDto extends Partial<CreateStationDto> {
  isActive?: boolean;
}

export const stationService = {
  async getAll(): Promise<Station[]> {
    const response = await axiosInstance.get('/stations');
    return response.data;
  },

  async getById(id: string): Promise<Station> {
    const response = await axiosInstance.get(`/stations/${id}`);
    return response.data;
  },

  async create(data: CreateStationDto): Promise<Station> {
    const response = await axiosInstance.post('/stations', data);
    return response.data;
  },

  async update(id: string, data: UpdateStationDto): Promise<Station> {
    const response = await axiosInstance.patch(`/stations/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/stations/${id}`);
  },

  async toggleActive(id: string, isActive: boolean): Promise<Station> {
    const response = await axiosInstance.patch(`/stations/${id}`, { isActive });
    return response.data;
  },
};
