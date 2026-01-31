export type FuelType = 'DIESEL' | 'GASOIL' | 'ESSENCE' | 'SUPER';

export interface Tank {
  id: string;
  name: string;
  fuelType: FuelType;
  capacity: number;
  currentLevel: number;
  minLevel: number;
  pricePerLiter: number;
  stationId: string;
  isActive: boolean;
  lastRefillAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TankWithStation extends Tank {
  station: {
    id: string;
    name: string;
  };
}

export interface CreateTankDto {
  name: string;
  fuelType: FuelType;
  capacity: number;
  currentLevel: number;
  minLevel: number;
  pricePerLiter: number;
  stationId: string;
}

export interface UpdateTankDto {
  name?: string;
  capacity?: number;
  minLevel?: number;
  pricePerLiter?: number;
  isActive?: boolean;
}

export interface TankFilters {
  stationId?: string;
  fuelType?: FuelType;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface TankRefill {
  id: string;
  tankId: string;
  quantity: number;
  previousLevel: number;
  newLevel: number;
  supplierName?: string;
  deliveryNote?: string;
  refillAt: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateRefillDto {
  quantity: number;
  supplierName?: string;
  deliveryNote?: string;
}

export interface StockMovement {
  id: string;
  tankId: string;
  type: 'REFILL' | 'SALE' | 'ADJUSTMENT' | 'LOSS';
  quantity: number;
  previousLevel: number;
  newLevel: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: 'Diesel',
  GASOIL: 'Gasoil',
  ESSENCE: 'Essence',
  SUPER: 'Super',
};

export const FUEL_TYPE_COLORS: Record<FuelType, string> = {
  DIESEL: 'bg-amber-500',
  GASOIL: 'bg-green-500',
  ESSENCE: 'bg-blue-500',
  SUPER: 'bg-red-500',
};
