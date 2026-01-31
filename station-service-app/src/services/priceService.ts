import { axiosInstance } from './api';

export interface FuelType {
  id: string;
  name: string;
  code: string;
  color: string;
  isActive: boolean;
}

export interface Price {
  id: string;
  fuelTypeId: string;
  stationId: string;
  sellingPriceTTC: number;
  sellingPriceHT: number;
  purchasePrice: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  fuelType?: FuelType;
  station?: {
    id: string;
    name: string;
  };
}

export interface CreatePriceDto {
  fuelTypeId: string;
  stationId: string;
  sellingPriceTTC: number;
  purchasePrice: number;
  effectiveFrom?: string;
}

export const priceService = {
  async getCurrentPrices(stationId: string): Promise<Price[]> {
    const response = await axiosInstance.get(`/prices/current/${stationId}`);
    return response.data;
  },

  async getPriceHistory(stationId: string, fuelTypeId?: string): Promise<Price[]> {
    const params = fuelTypeId ? { fuelTypeId } : {};
    const response = await axiosInstance.get(`/prices/history/${stationId}`, { params });
    return response.data;
  },

  async create(data: CreatePriceDto): Promise<Price> {
    const response = await axiosInstance.post('/prices', data);
    return response.data;
  },

  async getFuelTypes(): Promise<FuelType[]> {
    const response = await axiosInstance.get('/fuel-types');
    return response.data;
  },

  calculateHT(priceTTC: number, tvaRate: number = 0.20): number {
    return Number((priceTTC / (1 + tvaRate)).toFixed(2));
  },

  calculateMargin(sellingPriceHT: number, purchasePrice: number): number {
    return Number((sellingPriceHT - purchasePrice).toFixed(2));
  },
};
