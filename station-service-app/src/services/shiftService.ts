import { axiosInstance } from './api';

export interface Shift {
  id: string;
  nozzleId: string;
  pompisteId: string;
  indexStart: number;
  indexEnd: number | null;
  startedAt: string;
  endedAt: string | null;
  status: 'OPEN' | 'CLOSED' | 'VALIDATED';
  incidentNote: string | null;
  nozzle?: {
    id: string;
    reference: string;
    currentIndex: number;
    dispenser: {
      id: string;
      reference: string;
    };
    tank: {
      id: string;
      fuelType: {
        id: string;
        code: string;
        name: string;
      };
    };
  };
}

export interface ShiftSummary {
  shift: Shift;
  litersTotal: number;
  salesCount: number;
  totalAmount: number;
  byPaymentMethod: {
    methodId: string;
    methodName: string;
    amount: number;
  }[];
}

export interface StartShiftDto {
  nozzleId: string;
  indexStart: number;
}

export interface EndShiftDto {
  indexEnd: number;
  incidentNote?: string;
}

export const shiftService = {
  /**
   * Start a new shift
   */
  startShift: async (data: StartShiftDto): Promise<Shift> => {
    const response = await axiosInstance.post<Shift>('/shifts/start', data);
    return response.data;
  },

  /**
   * End a shift
   */
  endShift: async (shiftId: string, data: EndShiftDto): Promise<Shift> => {
    const response = await axiosInstance.post<Shift>(`/shifts/${shiftId}/end`, data);
    return response.data;
  },

  /**
   * Get current open shift for the authenticated pompiste
   */
  getCurrentShift: async (): Promise<Shift | null> => {
    try {
      const response = await axiosInstance.get<Shift[]>('/shifts/open');
      return response.data.length > 0 ? response.data[0] : null;
    } catch {
      return null;
    }
  },

  /**
   * Get shift by ID
   */
  getShift: async (shiftId: string): Promise<Shift> => {
    const response = await axiosInstance.get<Shift>(`/shifts/${shiftId}`);
    return response.data;
  },

  /**
   * Get shift summary with sales data
   */
  getShiftSummary: async (shiftId: string): Promise<ShiftSummary> => {
    const response = await axiosInstance.get<ShiftSummary>(`/shifts/${shiftId}`);
    return response.data;
  },

  /**
   * Get shifts by pompiste
   */
  getShiftsByPompiste: async (pompisteId: string): Promise<Shift[]> => {
    const response = await axiosInstance.get<Shift[]>(`/shifts/by-pompiste/${pompisteId}`);
    return response.data;
  },
};

export default shiftService;
