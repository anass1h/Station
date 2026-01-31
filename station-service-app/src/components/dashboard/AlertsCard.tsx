import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  BellIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  triggeredAt: string;
}

interface AlertsCardProps {
  alerts: Alert[];
  totalCount: number;
  loading?: boolean;
}

const priorityConfig = {
  CRITICAL: {
    icon: ExclamationTriangleIcon,
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-200',
    dot: 'bg-danger-500',
  },
  HIGH: {
    icon: ExclamationCircleIcon,
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-200',
    dot: 'bg-warning-500',
  },
  MEDIUM: {
    icon: InformationCircleIcon,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  LOW: {
    icon: BellIcon,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
};

export function AlertsCard({ alerts, totalCount, loading = false }: AlertsCardProps) {
  const navigate = useNavigate();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-5 bg-secondary-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-secondary-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-200 rounded w-full" />
                <div className="h-3 bg-secondary-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">
          Alertes Actives
        </h3>
        {totalCount > 0 && (
          <span className="px-2.5 py-1 text-sm font-medium bg-danger-100 text-danger-700 rounded-full">
            {totalCount}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <BellIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
          <p className="text-secondary-500">Aucune alerte active</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 5).map((alert) => {
            const config = priorityConfig[alert.priority];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.border} ${config.bg}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${config.text} line-clamp-2`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {formatTime(alert.triggeredAt)}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
              </div>
            );
          })}
        </div>
      )}

      {totalCount > 0 && (
        <button
          onClick={() => navigate('/alertes')}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Voir toutes les alertes
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
