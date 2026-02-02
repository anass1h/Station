import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FunnelIcon, BellIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { alertService, AlertPriority, AlertStatus, AlertType } from '@/services/alertService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { AlertCard, AlertFilters } from '@/components/alerts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AlertsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedStationId, setSelectedStationId] = useState<string>(user?.stationId || '');

  // Fetch stations for SUPER_ADMIN
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  // Auto-select first station for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin && !selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0].id);
    }
  }, [isSuperAdmin, selectedStationId, stations]);

  const stationId = selectedStationId || user?.stationId || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: '' as AlertPriority | '',
    type: '' as AlertType | '',
    status: '' as AlertStatus | '',
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', stationId, filters],
    queryFn: () => alertService.getAlerts(stationId, {
      priority: filters.priority || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
    }),
    enabled: !!stationId,
    refetchInterval: 30000, // Polling every 30 seconds
  });

  const { data: alertsCount } = useQuery({
    queryKey: ['alertsCount', stationId],
    queryFn: () => alertService.getAlertsCount(stationId),
    enabled: !!stationId,
    refetchInterval: 30000,
  });

  // Sort alerts by priority (CRITICAL first) then by date (newest first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder: Record<AlertPriority, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Alertes</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Suivi des alertes et notifications'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Station selector for SUPER_ADMIN */}
          {isSuperAdmin && stations.length > 0 && (
            <div className="relative">
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="flex items-center gap-2 px-4 py-2 pr-8 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors text-sm font-medium text-secondary-700 appearance-none cursor-pointer"
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              <BuildingStorefrontIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filtres</span>
          </button>
        </div>
      </div>

      {/* Priority Counters */}
      {alertsCount && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg">🔴</span>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Critique</p>
                <p className="text-2xl font-bold text-red-600">{alertsCount.critical}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-lg">🟠</span>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Haute</p>
                <p className="text-2xl font-bold text-orange-600">{alertsCount.high}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-lg">🟡</span>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Moyenne</p>
                <p className="text-2xl font-bold text-yellow-600">{alertsCount.medium}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg">🔵</span>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Basse</p>
                <p className="text-2xl font-bold text-blue-600">{alertsCount.low}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <AlertFilters
          filters={filters}
          onChange={setFilters}
        />
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <BellIcon className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">Aucune alerte</h3>
          <p className="text-secondary-500">
            {filters.priority || filters.type || filters.status
              ? 'Aucune alerte ne correspond aux filtres selectionnes.'
              : 'Tout est sous controle !'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
