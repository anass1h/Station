export interface FuelTypeSales {
  fuelType: string;
  fuelTypeId: string;
  liters: number;
  amount: number;
}

export interface PompisteSales {
  pompisteId: string;
  pompiste: string;
  liters: number;
  amount: number;
}

export interface DailySummary {
  date: string;
  totalSalesLiters: number;
  totalSalesAmount: number;
  salesByFuelType: FuelTypeSales[];
  salesByPompiste: PompisteSales[];
  shiftsCount: number;
  avgCashVariance: number;
}

export interface DailyEvolution {
  date: string;
  liters: number;
  amount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalSalesLiters: number;
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  estimatedMargin: number;
  dailyEvolution: DailyEvolution[];
  comparisonPreviousMonth: {
    litersChange: number;
    amountChange: number;
  };
  topPompistes: PompisteSales[];
}

export interface TankStatus {
  tankId: string;
  reference: string;
  fuelType: string;
  fuelTypeId: string;
  currentLevel: number;
  capacity: number;
  percentage: number;
  lowThreshold: number;
  isLow: boolean;
  daysRemaining: number | null;
}

export interface StockStatus {
  tanks: TankStatus[];
  totalCapacity: number;
  totalCurrentLevel: number;
  alertsCount: number;
}

export interface PompistePerformance {
  pompisteId: string;
  pompisteName: string;
  totalShifts: number;
  totalHoursWorked: number;
  totalSalesLiters: number;
  totalSalesAmount: number;
  avgSalesPerShift: number;
  avgCashVariance: number;
  incidentsCount: number;
}

export interface FinancialSummary {
  year: number;
  month: number;
  revenue: number;
  revenueHT: number;
  vatCollected: number;
  purchases: number;
  estimatedMargin: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

export interface AlertsOverview {
  totalActive: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<string, number>;
  recentAlerts: Array<{
    id: string;
    title: string;
    priority: string;
    type: string;
    triggeredAt: Date;
  }>;
}

export interface GlobalSummary {
  year: number;
  month: number;
  stationsCount: number;
  totalSalesLiters: number;
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  estimatedMargin: number;
  byStation: Array<{
    stationId: string;
    stationName: string;
    salesLiters: number;
    salesAmount: number;
  }>;
  activeAlertsCount: number;
}

export interface PompisteDebtsOverview {
  totalActiveDebts: number;
  activeDebtsCount: number;
  pompistesWithDebtsCount: number;
  topDebtors: Array<{
    pompiste: {
      id: string;
      firstName: string;
      lastName: string;
      badgeCode: string | null;
    } | null;
    totalDebt: number;
  }>;
}
