import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  CalculatorIcon,
  WrenchIcon,
  CreditCardIcon,
  CheckIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Alert, alertService, AlertType } from '@/services/alertService';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface AlertCardProps {
  alert: Alert;
}

const typeIcons: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  LOW_STOCK: ExclamationTriangleIcon,
  SHIFT_OPEN_TOO_LONG: ClockIcon,
  CASH_VARIANCE: BanknotesIcon,
  INDEX_VARIANCE: CalculatorIcon,
  MAINTENANCE_DUE: WrenchIcon,
  CREDIT_LIMIT: CreditCardIcon,
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'border-l-red-500 bg-red-50',
  HIGH: 'border-l-orange-500 bg-orange-50',
  MEDIUM: 'border-l-yellow-500 bg-yellow-50',
  LOW: 'border-l-blue-500 bg-blue-50',
};

export function AlertCard({ alert }: AlertCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const Icon = typeIcons[alert.type];
  const typeConfig = alertService.getTypeConfig(alert.type);
  const priorityConfig = alertService.getPriorityConfig(alert.priority);
  const statusConfig = alertService.getStatusConfig(alert.status);

  const acknowledgeMutation = useMutation({
    mutationFn: () => alertService.acknowledgeAlert(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => alertService.resolveAlert(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: () => alertService.ignoreAlert(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  return (
    <div
      onClick={() => navigate(`/alertes/${alert.id}`)}
      className={`border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${priorityColors[alert.priority]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${priorityConfig.bgColor}`}>
          <Icon className={`h-5 w-5 ${priorityConfig.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
            <span className="text-xs text-secondary-500">{typeConfig.label}</span>
            <StatusBadge label={statusConfig.label} variant={statusConfig.variant} />
          </div>

          <h3 className="font-medium text-secondary-900 truncate">{alert.title}</h3>
          <p className="text-sm text-secondary-600 line-clamp-2 mt-1">{alert.message}</p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-secondary-400">
              {alertService.formatRelativeTime(alert.createdAt)}
            </span>

            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {alert.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => acknowledgeMutation.mutate()}
                    disabled={acknowledgeMutation.isPending}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-100 rounded transition-colors"
                    title="Prendre en charge"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Prendre en charge</span>
                  </button>
                  <button
                    onClick={() => ignoreMutation.mutate()}
                    disabled={ignoreMutation.isPending}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-secondary-500 hover:bg-secondary-100 rounded transition-colors"
                    title="Ignorer"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Ignorer</span>
                  </button>
                </>
              )}
              {alert.status === 'ACKNOWLEDGED' && (
                <button
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-success-600 hover:bg-success-100 rounded transition-colors"
                  title="Résoudre"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Résoudre</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
