import { axiosInstance } from './api';

// Types
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

export interface AlertOverview {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  triggeredAt: string;
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
  recentAlerts: AlertOverview[];
}

export interface TopDebtor {
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
    badgeCode: string | null;
  } | null;
  totalDebt: number;
}

export interface DebtsOverview {
  totalActiveDebts: number;
  activeDebtsCount: number;
  pompistesWithDebtsCount: number;
  topDebtors: TopDebtor[];
}

export interface ActiveShift {
  id: string;
  pompisteId: string;
  pompisteName: string;
  nozzleReference: string;
  fuelTypeName: string;
  startedAt: string;
  indexStart: number;
  currentIndex: number;
  salesCount: number;
  totalAmount: number;
}

export interface RecentSale {
  id: string;
  soldAt: string;
  pompisteName: string;
  fuelTypeName: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
}

export const dashboardService = {
  /**
   * Get daily summary for a station
   */
  getDailySummary: async (stationId: string, date?: string): Promise<DailySummary> => {
    const response = await axiosInstance.get<DailySummary>(`/dashboard/daily/${stationId}`, {
      params: date ? { date } : undefined,
    });
    return response.data;
  },

  /**
   * Get monthly summary for a station
   */
  getMonthlySummary: async (stationId: string, year?: number, month?: number): Promise<MonthlySummary> => {
    const response = await axiosInstance.get<MonthlySummary>(`/dashboard/monthly/${stationId}`, {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Get stock status for a station
   */
  getStockStatus: async (stationId: string): Promise<StockStatus> => {
    const response = await axiosInstance.get<StockStatus>(`/dashboard/stock/${stationId}`);
    return response.data;
  },

  /**
   * Get alerts overview for a station
   */
  getAlertsOverview: async (stationId: string): Promise<AlertsOverview> => {
    const response = await axiosInstance.get<AlertsOverview>(`/dashboard/alerts/${stationId}`);
    return response.data;
  },

  /**
   * Get debts overview for a station
   */
  getDebtsOverview: async (stationId: string): Promise<DebtsOverview> => {
    const response = await axiosInstance.get<DebtsOverview>(`/dashboard/debts/${stationId}`);
    return response.data;
  },

  /**
   * Get active shifts for a station
   */
  getActiveShifts: async (stationId: string): Promise<ActiveShift[]> => {
    const response = await axiosInstance.get<ActiveShift[]>('/shifts', {
      params: { stationId, status: 'OPEN' },
    });
    return response.data;
  },

  /**
   * Get recent sales for a station
   */
  getRecentSales: async (stationId: string, limit: number = 10): Promise<RecentSale[]> => {
    const response = await axiosInstance.get<RecentSale[]>('/sales/recent', {
      params: { stationId, limit },
    });
    return response.data;
  },

  /**
   * Get low stock alerts for a station
   */
  getLowStockAlerts: async (stationId: string): Promise<TankStatus[]> => {
    const stockStatus = await dashboardService.getStockStatus(stationId);
    return stockStatus.tanks.filter(tank => tank.isLow);
  },

  /**
   * Get pompiste performance metrics
   */
  getPompistePerformance: async (stationId: string, pompisteId?: string, period?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    pompisteId: string;
    pompisteName: string;
    shiftsCount: number;
    totalLiters: number;
    totalAmount: number;
    avgSalesPerShift: number;
    avgLitersPerShift: number;
    cashVariances: number;
  }[]> => {
    const response = await axiosInstance.get(`/dashboard/pompiste-performance/${stationId}`, {
      params: { pompisteId, ...period },
    });
    return response.data;
  },

  /**
   * Get financial summary for a station
   */
  getFinancialSummary: async (stationId: string, period?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    receivables: number;
    debts: number;
    byFuelType: {
      fuelTypeId: string;
      name: string;
      revenue: number;
      cost: number;
      margin: number;
    }[];
    byPaymentMethod: {
      methodId: string;
      name: string;
      amount: number;
    }[];
  }> => {
    const response = await axiosInstance.get(`/dashboard/financial/${stationId}`, {
      params: period,
    });
    return response.data;
  },

  /**
   * Get global summary overview (for SUPER_ADMIN only, no stationId)
   */
  getGlobalSummary: async (): Promise<{
    salesCount: number;
    totalLiters: number;
    totalAmount: number;
    activeShifts: number;
    activePompistes: number;
    activeAlerts: number;
    lowStockTanks: number;
    pendingDebts: number;
    unpaidInvoices: number;
    lastUpdated: string;
  }> => {
    const response = await axiosInstance.get('/dashboard/global');
    return response.data;
  },
};

export default dashboardService;
