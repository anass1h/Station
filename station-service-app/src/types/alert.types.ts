export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
export type AlertType =
  | 'LOW_STOCK'
  | 'SHIFT_OPEN_TOO_LONG'
  | 'CASH_VARIANCE'
  | 'INDEX_VARIANCE'
  | 'MAINTENANCE_DUE'
  | 'CREDIT_LIMIT'
  | 'PAYMENT_OVERDUE'
  | 'TANK_LEAK'
  | 'SYSTEM_ERROR';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  stationId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  ignoredBy?: string;
  ignoredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertWithDetails extends Alert {
  station: {
    id: string;
    name: string;
  };
  acknowledgedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  resolvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AlertsCount {
  total: number;
  byPriority: Record<AlertPriority, number>;
  byStatus: Record<AlertStatus, number>;
}

export interface AlertFilters {
  stationId?: string;
  type?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  startDate?: string;
  endDate?: string;
}

export interface AcknowledgeAlertDto {
  notes?: string;
}

export interface ResolveAlertDto {
  resolution: string;
  notes?: string;
}

export interface IgnoreAlertDto {
  reason: string;
}

export const ALERT_PRIORITY_LABELS: Record<AlertPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

export const ALERT_PRIORITY_COLORS: Record<AlertPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Prise en compte',
  RESOLVED: 'Résolue',
  IGNORED: 'Ignorée',
};

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  ACTIVE: 'bg-red-100 text-red-800',
  ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  IGNORED: 'bg-gray-100 text-gray-800',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  LOW_STOCK: 'Stock bas',
  SHIFT_OPEN_TOO_LONG: 'Poste ouvert trop longtemps',
  CASH_VARIANCE: 'Écart de caisse',
  INDEX_VARIANCE: 'Écart d\'index',
  MAINTENANCE_DUE: 'Maintenance requise',
  CREDIT_LIMIT: 'Limite de crédit',
  PAYMENT_OVERDUE: 'Paiement en retard',
  TANK_LEAK: 'Fuite de citerne',
  SYSTEM_ERROR: 'Erreur système',
};
