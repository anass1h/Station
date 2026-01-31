import { axiosInstance } from './api';

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
export type AlertType =
  | 'LOW_STOCK'
  | 'SHIFT_OPEN_TOO_LONG'
  | 'CASH_VARIANCE'
  | 'INDEX_VARIANCE'
  | 'MAINTENANCE_DUE'
  | 'CREDIT_LIMIT';

export interface Alert {
  id: string;
  stationId: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  acknowledgedById: string | null;
  acknowledgedAt: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  ignoredById: string | null;
  ignoredAt: string | null;
  createdAt: string;
  updatedAt: string;
  acknowledgedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  resolvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  ignoredBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AlertsCount {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  active: number;
  acknowledged: number;
}

export const alertService = {
  async getAlerts(stationId: string, filters?: {
    status?: AlertStatus | AlertStatus[];
    priority?: AlertPriority | AlertPriority[];
    type?: AlertType | AlertType[];
  }): Promise<Alert[]> {
    const response = await axiosInstance.get('/alerts', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getAlert(id: string): Promise<Alert> {
    const response = await axiosInstance.get(`/alerts/${id}`);
    return response.data;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const response = await axiosInstance.post(`/alerts/${id}/acknowledge`);
    return response.data;
  },

  async resolveAlert(id: string, resolution?: string): Promise<Alert> {
    const response = await axiosInstance.post(`/alerts/${id}/resolve`, { resolution });
    return response.data;
  },

  async ignoreAlert(id: string, reason?: string): Promise<Alert> {
    const response = await axiosInstance.post(`/alerts/${id}/ignore`, { reason });
    return response.data;
  },

  async getAlertsCount(stationId: string): Promise<AlertsCount> {
    const response = await axiosInstance.get(`/alerts/count/${stationId}`);
    return response.data;
  },

  getTypeConfig(type: AlertType): { label: string; icon: string } {
    const config: Record<AlertType, { label: string; icon: string }> = {
      LOW_STOCK: { label: 'Stock bas', icon: 'ExclamationTriangleIcon' },
      SHIFT_OPEN_TOO_LONG: { label: 'Shift trop long', icon: 'ClockIcon' },
      CASH_VARIANCE: { label: 'Écart caisse', icon: 'BanknotesIcon' },
      INDEX_VARIANCE: { label: 'Écart index', icon: 'CalculatorIcon' },
      MAINTENANCE_DUE: { label: 'Maintenance due', icon: 'WrenchIcon' },
      CREDIT_LIMIT: { label: 'Plafond crédit', icon: 'CreditCardIcon' },
    };
    return config[type];
  },

  getPriorityConfig(priority: AlertPriority): { label: string; color: string; bgColor: string } {
    const config: Record<AlertPriority, { label: string; color: string; bgColor: string }> = {
      CRITICAL: { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100' },
      HIGH: { label: 'Haute', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      MEDIUM: { label: 'Moyenne', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      LOW: { label: 'Basse', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    };
    return config[priority];
  },

  getStatusConfig(status: AlertStatus): { label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' } {
    const config: Record<AlertStatus, { label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' }> = {
      ACTIVE: { label: 'Active', variant: 'danger' },
      ACKNOWLEDGED: { label: 'Prise en charge', variant: 'warning' },
      RESOLVED: { label: 'Résolue', variant: 'success' },
      IGNORED: { label: 'Ignorée', variant: 'secondary' },
    };
    return config[status];
  },

  formatRelativeTime(date: string): string {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return alertDate.toLocaleDateString('fr-FR');
  },
};
