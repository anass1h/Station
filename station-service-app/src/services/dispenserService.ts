import { axiosInstance } from './api';

export interface Dispenser {
  id: string;
  stationId: string;
  reference: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station?: {
    id: string;
    name: string;
  };
  nozzles?: {
    id: string;
    reference: string;
    position: number;
  }[];
  _count?: {
    nozzles: number;
  };
}

export interface CreateDispenserDto {
  stationId: string;
  reference: string;
}

export interface UpdateDispenserDto {
  reference?: string;
  isActive?: boolean;
}

export const dispenserService = {
  async getAll(stationId?: string): Promise<Dispenser[]> {
    const params = stationId ? { stationId } : {};
    const response = await axiosInstance.get('/dispensers', { params });
    return response.data;
  },

  async getById(id: string): Promise<Dispenser> {
    const response = await axiosInstance.get(`/dispensers/${id}`);
    return response.data;
  },

  async getByStation(stationId: string): Promise<Dispenser[]> {
    const response = await axiosInstance.get(`/dispensers/station/${stationId}`);
    return response.data;
  },

  async create(data: CreateDispenserDto): Promise<Dispenser> {
    const response = await axiosInstance.post('/dispensers', data);
    return response.data;
  },

  async update(id: string, data: UpdateDispenserDto): Promise<Dispenser> {
    const response = await axiosInstance.patch(`/dispensers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/dispensers/${id}`);
  },
};
