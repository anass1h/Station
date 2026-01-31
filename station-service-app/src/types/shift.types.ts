export type ShiftStatus = 'OPEN' | 'CLOSED' | 'VALIDATED';

export interface Shift {
  id: string;
  pompisteId: string;
  stationId: string;
  startTime: string;
  endTime?: string;
  status: ShiftStatus;
  initialCash: number;
  finalCash?: number;
  cashVariance?: number;
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftWithDetails extends Shift {
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
  };
  station: {
    id: string;
    name: string;
  };
  salesCount: number;
  totalSales: number;
  totalVolume: number;
}

export interface ShiftSummary {
  totalSales: number;
  totalVolume: number;
  salesByFuelType: Array<{
    fuelType: string;
    volume: number;
    amount: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export interface StartShiftDto {
  initialCash: number;
  notes?: string;
}

export interface EndShiftDto {
  finalCash: number;
  notes?: string;
}

export interface ValidateShiftDto {
  approved: boolean;
  notes?: string;
}

export interface ShiftFilters {
  pompisteId?: string;
  stationId?: string;
  status?: ShiftStatus;
  startDate?: string;
  endDate?: string;
}

export interface IndexReading {
  id: string;
  shiftId: string;
  tankId: string;
  type: 'START' | 'END';
  value: number;
  createdAt: string;
}

export interface CreateIndexReadingDto {
  tankId: string;
  type: 'START' | 'END';
  value: number;
}

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  OPEN: 'En cours',
  CLOSED: 'Terminé',
  VALIDATED: 'Validé',
};

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-blue-100 text-blue-800',
};
