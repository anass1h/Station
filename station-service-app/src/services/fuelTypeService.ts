import { axiosInstance } from './api';

export interface FuelType {
  id: string;
  name: string;
  code: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fuelTypeService = {
  async getAll(): Promise<FuelType[]> {
    const response = await axiosInstance.get('/fuel-types');
    return response.data;
  },

  async getActive(): Promise<FuelType[]> {
    // Backend's findAll already returns only active fuel types
    const response = await axiosInstance.get('/fuel-types');
    return response.data;
  },

  async getById(id: string): Promise<FuelType> {
    const response = await axiosInstance.get(`/fuel-types/${id}`);
    return response.data;
  },
};
