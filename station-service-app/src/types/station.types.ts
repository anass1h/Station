export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StationWithDetails extends Station {
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tanksCount: number;
  pompistesCount: number;
}

export interface CreateStationDto {
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  managerId?: string;
}

export interface UpdateStationDto {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface StationFilters {
  city?: string;
  isActive?: boolean;
  search?: string;
}

export interface StationStats {
  totalSales: number;
  totalVolume: number;
  activeShifts: number;
  lowStockTanks: number;
}
