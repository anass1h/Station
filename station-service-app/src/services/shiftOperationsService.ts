import { axiosInstance } from './api';

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'VALIDATED';

export interface ShiftSummary {
  id: string;
  stationId: string;
  pompisteId: string;
  nozzleId: string;
  status: ShiftStatus;
  startTime: string;
  endTime: string | null;
  startIndex: number;
  endIndex: number | null;
  totalLiters: number;
  totalAmount: number;
  salesCount: number;
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
    badgeCode: string | null;
  };
  nozzle: {
    id: string;
    reference: string;
    tank?: {
      id: string;
      reference: string;
      fuelType?: {
        id: string;
        name: string;
        color: string;
      };
    };
  };
  cashRegister?: {
    id: string;
    expectedAmount: number;
    declaredAmount: number;
    variance: number;
  };
}

export interface ShiftDetail extends ShiftSummary {
  sales: ShiftSale[];
  incidents: string | null;
  validatedAt: string | null;
  validatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ShiftSale {
  id: string;
  quantity: number;
  totalAmount: number;
  saleTime: string;
  paymentMethod: string;
  client?: {
    id: string;
    companyName: string | null;
    contactName: string;
  };
}

export interface CashRegisterSummary {
  id: string;
  shiftId: string;
  closedAt: string;
  expectedAmount: number;
  declaredAmount: number;
  variance: number;
  details: {
    paymentMethod: string;
    expected: number;
    declared: number;
    variance: number;
  }[];
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
  };
  shift: {
    id: string;
    startTime: string;
    endTime: string;
    totalLiters: number;
    totalAmount: number;
  };
}

export const shiftOperationsService = {
  async getShifts(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    pompisteId?: string;
    nozzleId?: string;
    status?: ShiftStatus;
  }): Promise<ShiftSummary[]> {
    const response = await axiosInstance.get('/shifts', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getShiftById(id: string): Promise<ShiftDetail> {
    const response = await axiosInstance.get(`/shifts/${id}`);
    return response.data;
  },

  async getShiftDetail(id: string): Promise<ShiftDetail> {
    return this.getShiftById(id);
  },

  async validateShift(id: string): Promise<ShiftDetail> {
    const response = await axiosInstance.post(`/shifts/${id}/validate`);
    return response.data;
  },

  async getCashRegisters(stationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    pompisteId?: string;
  }): Promise<CashRegisterSummary[]> {
    const response = await axiosInstance.get('/cash-registers', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getCashRegisterById(id: string): Promise<CashRegisterSummary> {
    const response = await axiosInstance.get(`/cash-registers/${id}`);
    return response.data;
  },
};
