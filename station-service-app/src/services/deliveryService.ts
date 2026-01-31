import { axiosInstance } from './api';

export interface Delivery {
  id: string;
  stationId: string;
  tankId: string;
  supplierId: string;
  receivedById: string;
  deliveryNumber: string;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  levelBefore: number;
  levelAfter: number;
  temperature: number | null;
  deliveryDate: string;
  createdAt: string;
  tank?: {
    id: string;
    reference: string;
    fuelType?: {
      id: string;
      name: string;
      color: string;
    };
  };
  supplier?: {
    id: string;
    name: string;
  };
  receivedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDeliveryDto {
  tankId: string;
  supplierId: string;
  deliveryNumber: string;
  quantity: number;
  purchasePrice: number;
  levelBefore: number;
  levelAfter: number;
  temperature?: number;
  deliveryDate?: string;
}

export const deliveryService = {
  async getAll(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
    tankId?: string;
  }): Promise<Delivery[]> {
    const response = await axiosInstance.get('/deliveries', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getById(id: string): Promise<Delivery> {
    const response = await axiosInstance.get(`/deliveries/${id}`);
    return response.data;
  },

  async create(stationId: string, data: CreateDeliveryDto): Promise<Delivery> {
    const response = await axiosInstance.post('/deliveries', {
      stationId,
      ...data,
    });
    return response.data;
  },
};
