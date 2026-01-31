import { axiosInstance } from './api';

export interface SalePayment {
  paymentMethodId: string;
  amount: number;
  reference?: string;
}

export interface CreateSaleDto {
  shiftId: string;
  fuelTypeId: string;
  quantity: number;
  unitPrice: number;
  payments: SalePayment[];
  clientId?: string;
}

export interface Sale {
  id: string;
  shiftId: string;
  fuelTypeId: string;
  clientId: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  soldAt: string;
  createdAt: string;
  fuelType?: {
    id: string;
    code: string;
    name: string;
  };
  payments?: {
    id: string;
    paymentMethodId: string;
    amount: number;
    reference: string | null;
    paymentMethod?: {
      id: string;
      code: string;
      name: string;
    };
  }[];
}

export interface ShiftSalesSummary {
  shiftId: string;
  totalLiters: number;
  totalAmount: number;
  salesCount: number;
  byPaymentMethod: {
    methodId: string;
    methodCode: string;
    methodName: string;
    amount: number;
    count: number;
  }[];
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  requiresReference: boolean;
  isActive: boolean;
}

export const saleService = {
  /**
   * Create a new sale
   */
  createSale: async (data: CreateSaleDto): Promise<Sale> => {
    const response = await axiosInstance.post<Sale>('/sales', data);
    return response.data;
  },

  /**
   * Get sales for a shift
   */
  getSalesByShift: async (shiftId: string): Promise<Sale[]> => {
    const response = await axiosInstance.get<Sale[]>(`/sales/by-shift/${shiftId}`);
    return response.data;
  },

  /**
   * Get sales summary for a shift
   */
  getShiftSalesSummary: async (shiftId: string): Promise<ShiftSalesSummary> => {
    const response = await axiosInstance.get<ShiftSalesSummary>(`/sales/by-shift/${shiftId}/summary`);
    return response.data;
  },

  /**
   * Get a single sale by ID
   */
  getSale: async (saleId: string): Promise<Sale> => {
    const response = await axiosInstance.get<Sale>(`/sales/${saleId}`);
    return response.data;
  },

  /**
   * Get all active payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await axiosInstance.get<PaymentMethod[]>('/payment-methods');
    return response.data;
  },

  /**
   * Get current fuel price for a station and fuel type
   */
  getCurrentPrice: async (stationId: string, fuelTypeId: string): Promise<{ price: number }> => {
    const response = await axiosInstance.get<{ price: number }>('/prices/current', {
      params: { stationId, fuelTypeId },
    });
    return response.data;
  },
};

export default saleService;
