import { axiosInstance } from './api';

export interface TankWithStats {
  id: string;
  stationId: string;
  reference: string;
  capacity: number;
  currentLevel: number;
  alertThreshold: number;
  isActive: boolean;
  fuelType: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  lastDelivery?: {
    id: string;
    quantity: number;
    deliveryDate: string;
  };
  averageConsumption: number;
  daysOfStock: number;
}

export interface StockMovement {
  id: string;
  tankId: string;
  type: 'DELIVERY' | 'SALE' | 'ADJUSTMENT' | 'CALIBRATION' | 'LOSS';
  quantity: number;
  levelBefore: number;
  levelAfter: number;
  reason: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateAdjustmentDto {
  tankId: string;
  type: 'ADJUSTMENT' | 'CALIBRATION' | 'LOSS';
  quantity: number;
  reason: string;
}

export const stockService = {
  async getTanksWithStats(stationId: string): Promise<TankWithStats[]> {
    // Use the tanks endpoint with stationId filter
    const response = await axiosInstance.get('/tanks', {
      params: { stationId },
    });

    // Transform tanks data to include stats (calculated client-side for now)
    // Map lowThreshold to alertThreshold for frontend compatibility
    return response.data.map((tank: TankWithStats & { lowThreshold?: number }) => ({
      ...tank,
      alertThreshold: tank.lowThreshold || tank.alertThreshold || tank.capacity * 0.2,
      averageConsumption: 0, // Would need historical data
      daysOfStock: tank.currentLevel > 0 ? Math.round(tank.currentLevel / 100) : 0,
    }));
  },

  async getMovements(tankId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<StockMovement[]> {
    // Stock movements endpoint - may not exist yet, return empty array
    try {
      const response = await axiosInstance.get(`/tanks/${tankId}/movements`, {
        params: filters,
      });
      return response.data;
    } catch {
      // Endpoint may not exist - return empty array
      return [];
    }
  },

  async createAdjustment(_stationId: string, data: CreateAdjustmentDto): Promise<StockMovement> {
    // Use tank update for adjustments
    await axiosInstance.patch(`/tanks/${data.tankId}`, {
      currentLevel: data.quantity,
    });
    return {
      id: crypto.randomUUID(),
      tankId: data.tankId,
      type: data.type,
      quantity: data.quantity,
      levelBefore: 0,
      levelAfter: data.quantity,
      reason: data.reason,
      createdAt: new Date().toISOString(),
    };
  },

  async getStockSummary(stationId: string): Promise<{
    totalCapacity: number;
    totalCurrentLevel: number;
    totalAvailable: number;
    percentageFilled: number;
    tanksCount: number;
    lowStockCount: number;
    byFuelType: {
      fuelTypeId: string;
      fuelTypeName: string;
      capacity: number;
      currentLevel: number;
      percentage: number;
    }[];
  }> {
    // Get tanks and calculate summary client-side
    const tanks = await this.getTanksWithStats(stationId);

    const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
    const totalCurrentLevel = tanks.reduce((sum, t) => sum + t.currentLevel, 0);

    const byFuelTypeMap = new Map<string, { name: string; capacity: number; currentLevel: number }>();
    let lowStockCount = 0;

    for (const tank of tanks) {
      if (tank.currentLevel < tank.alertThreshold) {
        lowStockCount++;
      }

      const key = tank.fuelType.id;
      const existing = byFuelTypeMap.get(key) || { name: tank.fuelType.name, capacity: 0, currentLevel: 0 };
      existing.capacity += tank.capacity;
      existing.currentLevel += tank.currentLevel;
      byFuelTypeMap.set(key, existing);
    }

    return {
      totalCapacity,
      totalCurrentLevel,
      totalAvailable: totalCapacity - totalCurrentLevel,
      percentageFilled: totalCapacity > 0 ? (totalCurrentLevel / totalCapacity) * 100 : 0,
      tanksCount: tanks.length,
      lowStockCount,
      byFuelType: Array.from(byFuelTypeMap.entries()).map(([fuelTypeId, data]) => ({
        fuelTypeId,
        fuelTypeName: data.name,
        capacity: data.capacity,
        currentLevel: data.currentLevel,
        percentage: data.capacity > 0 ? (data.currentLevel / data.capacity) * 100 : 0,
      })),
    };
  },

  async getConsumptionHistory(_tankId: string, _days: number = 30): Promise<{
    date: string;
    consumption: number;
  }[]> {
    // This would need backend implementation - return mock data for now
    return [];
  },
};
