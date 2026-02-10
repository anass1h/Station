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
  orderedQuantity: number | null;
  deliveryVariance: number | null;
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
  orderedQuantity?: number;
  deliveryDate?: string;
}

export const deliveryService = {
  async getAll(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
    tankId?: string;
  }): Promise<Delivery[]> {
    const response = await axiosInstance.get(`/deliveries/by-station/${stationId}`, {
      params: {
        from: filters?.startDate,
        to: filters?.endDate,
        supplierId: filters?.supplierId,
      },
    });
    return response.data;
  },

  async getById(id: string): Promise<Delivery> {
    const response = await axiosInstance.get(`/deliveries/${id}`);
    return response.data;
  },

  async create(_stationId: string, data: CreateDeliveryDto): Promise<Delivery> {
    const response = await axiosInstance.post('/deliveries', data);
    return response.data;
  },

  async getByTank(tankId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Delivery[]> {
    const response = await axiosInstance.get(`/deliveries/by-tank/${tankId}`, {
      params: {
        from: filters?.startDate,
        to: filters?.endDate,
      },
    });
    return response.data;
  },

  async getBySupplier(supplierId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Delivery[]> {
    const response = await axiosInstance.get(`/deliveries/by-supplier/${supplierId}`, {
      params: {
        from: filters?.startDate,
        to: filters?.endDate,
      },
    });
    return response.data;
  },

  async getStats(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalDeliveries: number;
    totalQuantity: number;
    totalAmount: number;
    byFuelType: {
      fuelTypeId: string;
      name: string;
      quantity: number;
      amount: number;
    }[];
    bySupplier: {
      supplierId: string;
      name: string;
      deliveries: number;
      quantity: number;
      amount: number;
    }[];
  }> {
    const response = await axiosInstance.get(`/deliveries/by-station/${stationId}/summary`, {
      params: {
        from: filters?.startDate,
        to: filters?.endDate,
      },
    });
    return response.data;
  },
};
