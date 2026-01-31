import { axiosInstance } from './api';

export interface Nozzle {
  id: string;
  reference: string;
  currentIndex: number;
  isActive: boolean;
  position: number;
  dispenserId: string;
  tankId: string;
  fuelTypeId: string;
  dispenser: {
    id: string;
    reference: string;
    stationId: string;
  };
  tank: {
    id: string;
    reference: string;
  };
  fuelType: {
    id: string;
    code: string;
    name: string;
  };
}

export interface NozzleWithStatus extends Nozzle {
  isOccupied: boolean;
}

export const nozzleService = {
  /**
   * Get all nozzles for a station with availability status
   */
  getAvailableNozzles: async (stationId: string): Promise<NozzleWithStatus[]> => {
    const response = await axiosInstance.get<NozzleWithStatus[]>('/nozzles', {
      params: { stationId, includeStatus: true },
    });
    return response.data;
  },

  /**
   * Get a single nozzle by ID
   */
  getNozzle: async (nozzleId: string): Promise<Nozzle> => {
    const response = await axiosInstance.get<Nozzle>(`/nozzles/${nozzleId}`);
    return response.data;
  },

  /**
   * Get nozzles by station
   */
  getNozzlesByStation: async (stationId: string): Promise<Nozzle[]> => {
    const response = await axiosInstance.get<Nozzle[]>('/nozzles', {
      params: { stationId },
    });
    return response.data;
  },

  /**
   * Get nozzles by dispenser
   */
  getNozzlesByDispenser: async (dispenserId: string): Promise<Nozzle[]> => {
    const response = await axiosInstance.get<Nozzle[]>('/nozzles', {
      params: { dispenserId },
    });
    return response.data;
  },

  /**
   * Get nozzles by station (alias for getNozzlesByStation)
   */
  getByStation: async (stationId: string): Promise<Nozzle[]> => {
    const response = await axiosInstance.get<Nozzle[]>('/nozzles', {
      params: { stationId },
    });
    return response.data;
  },

  /**
   * Get a single nozzle by ID
   */
  getById: async (id: string): Promise<Nozzle> => {
    const response = await axiosInstance.get<Nozzle>(`/nozzles/${id}`);
    return response.data;
  },

  /**
   * Create a new nozzle
   */
  create: async (data: {
    dispenserId: string;
    tankId: string;
    reference: string;
    position: number;
    currentIndex?: number;
  }): Promise<Nozzle> => {
    const response = await axiosInstance.post<Nozzle>('/nozzles', data);
    return response.data;
  },

  /**
   * Update a nozzle
   */
  update: async (id: string, data: {
    tankId?: string;
    reference?: string;
    position?: number;
    isActive?: boolean;
  }): Promise<Nozzle> => {
    const response = await axiosInstance.patch<Nozzle>(`/nozzles/${id}`, data);
    return response.data;
  },

  /**
   * Delete a nozzle
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/nozzles/${id}`);
  },
};

export default nozzleService;
