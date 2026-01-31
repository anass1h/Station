import { axiosInstance } from './api';

export interface TankWithStats {
  id: string;
  stationId: string;
  reference: string;
  capacity: number;
  currentLevel: number;
  alertThreshold: number;
  isActive: boolean;
  fuelType: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  lastDelivery?: {
    id: string;
    quantity: number;
    deliveryDate: string;
  };
  averageConsumption: number;
  daysOfStock: number;
}

export interface StockMovement {
  id: string;
  tankId: string;
  type: 'DELIVERY' | 'SALE' | 'ADJUSTMENT' | 'CALIBRATION' | 'LOSS';
  quantity: number;
  levelBefore: number;
  levelAfter: number;
  reason: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateAdjustmentDto {
  tankId: string;
  type: 'ADJUSTMENT' | 'CALIBRATION' | 'LOSS';
  quantity: number;
  reason: string;
}

export const stockService = {
  async getTanksWithStats(stationId: string): Promise<TankWithStats[]> {
    const response = await axiosInstance.get('/stock/tanks', {
      params: { stationId },
    });
    return response.data;
  },

  async getMovements(tankId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<StockMovement[]> {
    const response = await axiosInstance.get(`/stock/movements/${tankId}`, {
      params: filters,
    });
    return response.data;
  },

  async createAdjustment(stationId: string, data: CreateAdjustmentDto): Promise<StockMovement> {
    const response = await axiosInstance.post('/stock/adjustment', {
      stationId,
      ...data,
    });
    return response.data;
  },
};
