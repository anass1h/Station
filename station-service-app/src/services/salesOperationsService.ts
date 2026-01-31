import { axiosInstance } from './api';

export interface SaleSummary {
  id: string;
  shiftId: string;
  nozzleId: string;
  clientId: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleTime: string;
  indexBefore: number;
  indexAfter: number;
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
  };
  nozzle: {
    id: string;
    reference: string;
  };
  fuelType: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  client?: {
    id: string;
    companyName: string | null;
    contactName: string;
  };
  payments: {
    id: string;
    amount: number;
    paymentMethod: {
      id: string;
      name: string;
      code: string;
    };
    reference: string | null;
  }[];
}

export interface SaleDetail extends SaleSummary {
  shift: {
    id: string;
    startTime: string;
    endTime: string | null;
  };
  createdAt: string;
}

export const salesOperationsService = {
  async getSales(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    pompisteId?: string;
    fuelTypeId?: string;
    clientId?: string;
    paymentMethodId?: string;
  }): Promise<SaleSummary[]> {
    const response = await axiosInstance.get('/sales', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getSaleById(id: string): Promise<SaleDetail> {
    const response = await axiosInstance.get(`/sales/${id}`);
    return response.data;
  },

  async getSaleDetail(id: string): Promise<SaleDetail> {
    return this.getSaleById(id);
  },

  async getSalesStats(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalLiters: number;
    totalAmount: number;
    salesCount: number;
    byFuelType: {
      fuelTypeId: string;
      name: string;
      liters: number;
      amount: number;
    }[];
    byPaymentMethod: {
      paymentMethodId: string;
      name: string;
      amount: number;
      count: number;
    }[];
  }> {
    const response = await axiosInstance.get('/sales/stats', {
      params: { stationId, ...filters },
    });
    return response.data;
  },
};
