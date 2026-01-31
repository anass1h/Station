import { axiosInstance } from './api';

export interface PaymentDetailDto {
  paymentMethodId: string;
  actualAmount: number;
  reference?: string;
}

export interface CloseCashRegisterDto {
  shiftId: string;
  details: PaymentDetailDto[];
  varianceNote?: string;
  createDebtOnNegativeVariance?: boolean;
}

export interface PaymentDetail {
  id: string;
  paymentMethodId: string;
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  reference: string | null;
  paymentMethod: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CashRegister {
  id: string;
  shiftId: string;
  expectedTotal: number;
  actualTotal: number;
  variance: number;
  varianceNote: string | null;
  closedAt: string;
  createdAt: string;
  debtCreated?: boolean;
  shift?: {
    id: string;
    pompisteId: string;
    pompiste?: {
      id: string;
      firstName: string;
      lastName: string;
      badgeCode: string | null;
    };
  };
  paymentDetails: PaymentDetail[];
}

export interface ExpectedAmounts {
  total: number;
  byPaymentMethod: {
    paymentMethodId: string;
    methodCode: string;
    methodName: string;
    expectedAmount: number;
  }[];
}

export const cashRegisterService = {
  /**
   * Close a cash register
   */
  closeCashRegister: async (data: CloseCashRegisterDto): Promise<CashRegister> => {
    const response = await axiosInstance.post<CashRegister>('/cash-registers/close', data);
    return response.data;
  },

  /**
   * Get cash register by shift
   */
  getCashRegisterByShift: async (shiftId: string): Promise<CashRegister | null> => {
    try {
      const response = await axiosInstance.get<CashRegister>(`/cash-registers/shift/${shiftId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Get expected amounts for a shift (for cash register form)
   */
  getExpectedAmounts: async (shiftId: string): Promise<ExpectedAmounts> => {
    const response = await axiosInstance.get<ExpectedAmounts>(`/sales/by-shift/${shiftId}/expected`);
    return response.data;
  },

  /**
   * Get cash register by ID
   */
  getCashRegister: async (id: string): Promise<CashRegister> => {
    const response = await axiosInstance.get<CashRegister>(`/cash-registers/${id}`);
    return response.data;
  },
};

export default cashRegisterService;
