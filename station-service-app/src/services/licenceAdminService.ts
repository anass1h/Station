import { axiosInstance } from './api';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface LicenceStation {
  id: string;
  name: string;
  city: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  _count: {
    users: number;
    dispensers: number;
    tanks: number;
  };
}

export interface Licence {
  id: string;
  stationId: string;
  plan: 'BETA';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  startDate: string;
  endDate: string;
  maxUsers: number;
  maxDispensers: number;
  maxTanks: number;
  maxStations: number;
  gracePeriodDays: number;
  features: Record<string, boolean>;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  station?: LicenceStation;
}

export interface LicenceDetail extends Licence {
  daysRemaining: number;
  usage: {
    users: { current: number; max: number };
    dispensers: { current: number; max: number };
    tanks: { current: number; max: number };
  };
}

export interface LicenceStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  expiringSoon: number;
}

export interface LicenceCheckResult {
  valid: boolean;
  reason?: string;
  daysRemaining?: number;
  licence?: Licence;
}

// ═══════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════

export const licenceAdminService = {
  async getAll(): Promise<Licence[]> {
    const response = await axiosInstance.get('/licences');
    return response.data;
  },

  async getStats(): Promise<LicenceStats> {
    const response = await axiosInstance.get('/licences/stats');
    return response.data;
  },

  async getDetailByStation(stationId: string): Promise<LicenceDetail> {
    const response = await axiosInstance.get(`/licences/station/${stationId}`);
    return response.data;
  },

  async checkLicence(stationId: string): Promise<LicenceCheckResult> {
    const response = await axiosInstance.get(`/licences/check/${stationId}`);
    return response.data;
  },

  async create(data: {
    stationId: string;
    plan: 'BETA';
    durationMonths: number;
  }): Promise<Licence> {
    const response = await axiosInstance.post('/licences', data);
    return response.data;
  },

  async suspend(
    stationId: string,
    reason: string,
  ): Promise<Licence> {
    const response = await axiosInstance.patch(
      `/licences/station/${stationId}/suspend`,
      { reason },
    );
    return response.data;
  },

  async reactivate(
    stationId: string,
    extensionMonths: number,
  ): Promise<Licence> {
    const response = await axiosInstance.patch(
      `/licences/station/${stationId}/reactivate`,
      { extensionMonths },
    );
    return response.data;
  },

  async extend(
    stationId: string,
    months: number,
  ): Promise<Licence> {
    const response = await axiosInstance.patch(
      `/licences/station/${stationId}/extend`,
      { months },
    );
    return response.data;
  },

  async getExpiring(days: number = 7): Promise<Licence[]> {
    const response = await axiosInstance.get('/licences/expiring', {
      params: { days },
    });
    return response.data;
  },

  async processExpired(): Promise<{ processed: number }> {
    const response = await axiosInstance.post('/licences/process-expired');
    return response.data;
  },
};
