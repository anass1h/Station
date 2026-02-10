import { axiosInstance } from './api';

export interface AuditLog {
  id: string;
  userId: string | null;
  stationId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  station?: {
    id: string;
    name: string;
  };
}

export interface AuditLogFilters {
  stationId?: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditLogService = {
  async getAll(filters?: AuditLogFilters): Promise<PaginatedAuditLogs> {
    const response = await axiosInstance.get('/audit-logs', { params: filters });
    return response.data;
  },

  async getByUser(userId: string): Promise<AuditLog[]> {
    const response = await axiosInstance.get(`/audit-logs/user/${userId}`);
    return response.data;
  },
};
