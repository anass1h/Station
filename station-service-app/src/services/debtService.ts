import { axiosInstance } from './api';

export type DebtStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export type DebtReason =
  | 'CASH_VARIANCE'
  | 'SALARY_ADVANCE'
  | 'DAMAGE'
  | 'FUEL_LOSS'
  | 'OTHER';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: 'CASH' | 'SALARY_DEDUCTION' | 'OTHER';
  note: string | null;
  paymentDate: string;
  receivedById: string;
  receivedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface PompisteDebt {
  id: string;
  pompisteId: string;
  stationId: string;
  cashRegisterId: string | null;
  reason: DebtReason;
  description: string | null;
  initialAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  pompiste?: {
    id: string;
    firstName: string;
    lastName: string;
    badgeCode: string | null;
  };
  cashRegister?: {
    id: string;
    shiftId: string;
    variance: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  payments?: DebtPayment[];
}

export interface DebtsOverview {
  totalDebt: number;
  debtorsCount: number;
  averageDebt: number;
  pendingCount: number;
  partiallyPaidCount: number;
}

export interface DebtsByPompiste {
  pompisteId: string;
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
    badgeCode: string | null;
  };
  totalDebt: number;
  debtsCount: number;
  debts: PompisteDebt[];
}

export interface CreateDebtDto {
  pompisteId: string;
  reason: DebtReason;
  description?: string;
  initialAmount: number;
  cashRegisterId?: string;
}

export interface AddPaymentDto {
  amount: number;
  paymentMethod: 'CASH' | 'SALARY_DEDUCTION' | 'OTHER';
  note?: string;
  paymentDate?: string;
}

export const debtService = {
  async getDebts(stationId: string, filters?: {
    pompisteId?: string;
    status?: DebtStatus;
    reason?: DebtReason;
  }): Promise<PompisteDebt[]> {
    const response = await axiosInstance.get(`/pompiste-debts/station/${stationId}`, {
      params: filters,
    });
    return response.data;
  },

  async getDebtsByPompiste(pompisteId: string): Promise<PompisteDebt[]> {
    const response = await axiosInstance.get(`/pompiste-debts/pompiste/${pompisteId}`);
    return response.data;
  },

  async getDebt(id: string): Promise<PompisteDebt> {
    const response = await axiosInstance.get(`/pompiste-debts/${id}`);
    return response.data;
  },

  async createDebt(stationId: string, data: CreateDebtDto): Promise<PompisteDebt> {
    const response = await axiosInstance.post('/pompiste-debts', {
      stationId,
      ...data,
    });
    return response.data;
  },

  async addPayment(debtId: string, data: AddPaymentDto): Promise<DebtPayment> {
    const response = await axiosInstance.post(`/pompiste-debts/${debtId}/payment`, data);
    return response.data;
  },

  async cancelDebt(debtId: string, reason?: string): Promise<PompisteDebt> {
    const response = await axiosInstance.post(`/pompiste-debts/${debtId}/cancel`, { reason });
    return response.data;
  },

  async getDebtsOverview(stationId: string): Promise<DebtsOverview> {
    const response = await axiosInstance.get(`/pompiste-debts/overview/${stationId}`);
    return response.data;
  },

  async getDebtsGroupedByPompiste(stationId: string): Promise<DebtsByPompiste[]> {
    const response = await axiosInstance.get(`/pompiste-debts/by-pompiste/${stationId}`);
    return response.data;
  },

  getReasonLabel(reason: DebtReason): string {
    const labels: Record<DebtReason, string> = {
      CASH_VARIANCE: 'Écart de caisse',
      SALARY_ADVANCE: 'Avance sur salaire',
      DAMAGE: 'Casse/Dégât',
      FUEL_LOSS: 'Perte carburant',
      OTHER: 'Autre',
    };
    return labels[reason];
  },

  getStatusConfig(status: DebtStatus): { label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' } {
    const config: Record<DebtStatus, { label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' }> = {
      PENDING: { label: 'En attente', variant: 'danger' },
      PARTIALLY_PAID: { label: 'Partiel', variant: 'warning' },
      PAID: { label: 'Payée', variant: 'success' },
      CANCELLED: { label: 'Annulée', variant: 'secondary' },
    };
    return config[status];
  },
};
