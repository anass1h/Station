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
    const response = await axiosInstance.get(`/sales/by-station/${stationId}`, {
      params: {
        from: filters?.startDate,
        to: filters?.endDate,
        fuelTypeId: filters?.fuelTypeId,
        clientId: filters?.clientId,
      },
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
    // Get sales and calculate stats client-side since no stats endpoint exists
    const sales = await this.getSales(stationId, filters);

    const byFuelTypeMap = new Map<string, { name: string; liters: number; amount: number }>();
    const byPaymentMethodMap = new Map<string, { name: string; amount: number; count: number }>();

    let totalLiters = 0;
    let totalAmount = 0;

    for (const sale of sales) {
      totalLiters += sale.quantity;
      totalAmount += sale.totalAmount;

      // By fuel type
      const fuelKey = sale.fuelType.id;
      const existing = byFuelTypeMap.get(fuelKey) || { name: sale.fuelType.name, liters: 0, amount: 0 };
      existing.liters += sale.quantity;
      existing.amount += sale.totalAmount;
      byFuelTypeMap.set(fuelKey, existing);

      // By payment method
      for (const payment of sale.payments) {
        const methodKey = payment.paymentMethod.id;
        const existingMethod = byPaymentMethodMap.get(methodKey) || { name: payment.paymentMethod.name, amount: 0, count: 0 };
        existingMethod.amount += payment.amount;
        existingMethod.count += 1;
        byPaymentMethodMap.set(methodKey, existingMethod);
      }
    }

    return {
      totalLiters,
      totalAmount,
      salesCount: sales.length,
      byFuelType: Array.from(byFuelTypeMap.entries()).map(([fuelTypeId, data]) => ({
        fuelTypeId,
        ...data,
      })),
      byPaymentMethod: Array.from(byPaymentMethodMap.entries()).map(([paymentMethodId, data]) => ({
        paymentMethodId,
        ...data,
      })),
    };
  },
};
