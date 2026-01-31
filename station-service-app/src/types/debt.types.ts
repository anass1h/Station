export type DebtStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type DebtReason = 'CASH_VARIANCE' | 'SALARY_ADVANCE' | 'DAMAGE' | 'FUEL_LOSS' | 'OTHER';

export interface Debt {
  id: string;
  pompisteId: string;
  stationId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  reason: DebtReason;
  description?: string;
  status: DebtStatus;
  dueDate?: string;
  shiftId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtWithDetails extends Debt {
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  station: {
    id: string;
    name: string;
  };
  payments: DebtPayment[];
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paidAt: string;
  createdBy: string;
}

export interface PompisteDebt {
  pompisteId: string;
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
  };
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  debtsCount: number;
  oldestDebtDate?: string;
}

export interface DebtsOverview {
  totalDebt: number;
  totalPaid: number;
  totalRemaining: number;
  pendingCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  cancelledCount: number;
  byReason: Array<{
    reason: DebtReason;
    count: number;
    amount: number;
  }>;
}

export interface DebtsByPompiste {
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
  };
  debts: Debt[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface CreateDebtDto {
  pompisteId: string;
  amount: number;
  reason: DebtReason;
  description?: string;
  dueDate?: string;
  shiftId?: string;
}

export interface AddDebtPaymentDto {
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface DebtFilters {
  pompisteId?: string;
  stationId?: string;
  status?: DebtStatus;
  reason?: DebtReason;
  startDate?: string;
  endDate?: string;
}

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  PENDING: 'En attente',
  PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

export const DEBT_STATUS_COLORS: Record<DebtStatus, string> = {
  PENDING: 'bg-red-100 text-red-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export const DEBT_REASON_LABELS: Record<DebtReason, string> = {
  CASH_VARIANCE: 'Écart de caisse',
  SALARY_ADVANCE: 'Avance sur salaire',
  DAMAGE: 'Dommage matériel',
  FUEL_LOSS: 'Perte de carburant',
  OTHER: 'Autre',
};

export const DEBT_REASON_ICONS: Record<DebtReason, string> = {
  CASH_VARIANCE: 'BanknotesIcon',
  SALARY_ADVANCE: 'CurrencyDollarIcon',
  DAMAGE: 'WrenchScrewdriverIcon',
  FUEL_LOSS: 'BeakerIcon',
  OTHER: 'DocumentIcon',
};
