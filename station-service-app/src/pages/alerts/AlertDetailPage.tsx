import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  CalculatorIcon,
  WrenchIcon,
  CreditCardIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { alertService, AlertType } from '@/services/alertService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/utils/exportExcel';

const typeIcons: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  LOW_STOCK: ExclamationTriangleIcon,
  SHIFT_OPEN_TOO_LONG: ClockIcon,
  CASH_VARIANCE: BanknotesIcon,
  INDEX_VARIANCE: CalculatorIcon,
  MAINTENANCE_DUE: WrenchIcon,
  CREDIT_LIMIT: CreditCardIcon,
};

const entityLinks: Record<string, (id: string) => string> = {
  Tank: (id) => `/gestion/cuves/${id}`,
  Shift: (id) => `/operations/shifts/${id}`,
  Client: (id) => `/operations/clients/${id}`,
  Dispenser: (id) => `/gestion/distributeurs/${id}`,
  Nozzle: (id) => `/gestion/pistolets/${id}`,
};

export function AlertDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: alert, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertService.getAlert(id!),
    enabled: !!id,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => alertService.acknowledgeAlert(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => alertService.resolveAlert(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: () => alertService.ignoreAlert(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsCount'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Alerte non trouvee</p>
      </div>
    );
  }

  const Icon = typeIcons[alert.type];
  const typeConfig = alertService.getTypeConfig(alert.type);
  const priorityConfig = alertService.getPriorityConfig(alert.priority);
  const statusConfig = alertService.getStatusConfig(alert.status);

  const entityLink = alert.entityType && alert.entityId && entityLinks[alert.entityType]
    ? entityLinks[alert.entityType](alert.entityId)
    : null;

  // Build timeline
  const timeline = [
    {
      date: alert.createdAt,
      label: 'Alerte declenchee',
      color: 'bg-danger-500',
    },
  ];

  if (alert.acknowledgedAt && alert.acknowledgedBy) {
    timeline.push({
      date: alert.acknowledgedAt,
      label: `Prise en charge par ${alert.acknowledgedBy.firstName} ${alert.acknowledgedBy.lastName}`,
      color: 'bg-warning-500',
    });
  }

  if (alert.resolvedAt && alert.resolvedBy) {
    timeline.push({
      date: alert.resolvedAt,
      label: `Resolue par ${alert.resolvedBy.firstName} ${alert.resolvedBy.lastName}`,
      color: 'bg-success-500',
    });
  }

  if (alert.ignoredAt && alert.ignoredBy) {
    timeline.push({
      date: alert.ignoredAt,
      label: `Ignoree par ${alert.ignoredBy.firstName} ${alert.ignoredBy.lastName}`,
      color: 'bg-secondary-500',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/alertes')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{alert.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
              <StatusBadge label={statusConfig.label} variant={statusConfig.variant} dot />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {alert.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => acknowledgeMutation.mutate()}
                disabled={acknowledgeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                <EyeIcon className="h-5 w-5" />
                <span>Prendre en charge</span>
              </button>
              <button
                onClick={() => ignoreMutation.mutate()}
                disabled={ignoreMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-300 text-secondary-600 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
                <span>Ignorer</span>
              </button>
            </>
          )}
          {alert.status === 'ACKNOWLEDGED' && (
            <button
              onClick={() => resolveMutation.mutate()}
              disabled={resolveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
            >
              <CheckIcon className="h-5 w-5" />
              <span>Marquer comme resolue</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert Card */}
          <div className={`border-l-4 rounded-lg p-6 bg-white border border-secondary-200 ${
            alert.priority === 'CRITICAL' ? 'border-l-red-500' :
            alert.priority === 'HIGH' ? 'border-l-orange-500' :
            alert.priority === 'MEDIUM' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${priorityConfig.bgColor}`}>
                <Icon className={`h-6 w-6 ${priorityConfig.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-secondary-500 mb-1">{typeConfig.label}</p>
                <p className="text-secondary-700">{alert.message}</p>
              </div>
            </div>
          </div>

          {/* Entity Link */}
          {entityLink && (
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Entite liee
              </h3>
              <Link
                to={entityLink}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <div>
                  <p className="text-sm text-secondary-500">{alert.entityType}</p>
                  <p className="font-medium text-primary-600">Voir les details</p>
                </div>
                <ArrowLeftIcon className="h-5 w-5 text-secondary-400 rotate-180" />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">Type</span>
                <span className="font-medium">{typeConfig.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Priorite</span>
                <span className={`font-medium ${priorityConfig.color}`}>{priorityConfig.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Statut</span>
                <StatusBadge label={statusConfig.label} variant={statusConfig.variant} />
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Declenchee le</span>
                <span className="font-medium">{formatDateTime(alert.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Historique</h3>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${event.color}`} />
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-secondary-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-secondary-900">{event.label}</p>
                    <p className="text-xs text-secondary-500">{formatDateTime(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
