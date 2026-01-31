export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'MOBILE';

export interface Sale {
  id: string;
  shiftId: string;
  tankId: string;
  clientId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isCredit: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleWithDetails extends Sale {
  tank: {
    id: string;
    name: string;
    fuelType: string;
  };
  client?: {
    id: string;
    name: string;
    company?: string;
  };
  shift: {
    id: string;
    pompisteId: string;
    pompiste: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateSaleDto {
  tankId: string;
  clientId?: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  isCredit?: boolean;
  notes?: string;
}

export interface SaleFilters {
  shiftId?: string;
  stationId?: string;
  tankId?: string;
  clientId?: string;
  paymentMethod?: PaymentMethod;
  isCredit?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface SalesStats {
  totalSales: number;
  totalVolume: number;
  totalAmount: number;
  averageAmount: number;
  byFuelType: Array<{
    fuelType: string;
    volume: number;
    amount: number;
    count: number;
  }>;
  byPaymentMethod: Array<{
    method: PaymentMethod;
    amount: number;
    count: number;
  }>;
  byDay?: Array<{
    date: string;
    volume: number;
    amount: number;
    count: number;
  }>;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  CARD: 'Carte bancaire',
  CREDIT: 'Crédit',
  MOBILE: 'Paiement mobile',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  CASH: 'BanknotesIcon',
  CARD: 'CreditCardIcon',
  CREDIT: 'DocumentTextIcon',
  MOBILE: 'DevicePhoneMobileIcon',
};
