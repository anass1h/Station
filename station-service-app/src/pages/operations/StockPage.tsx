import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdjustmentsHorizontalIcon, TruckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { stockService, TankWithStats } from '@/services/stockService';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatNumber, formatDate } from '@/utils/exportExcel';

export function StockPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const { data: tanks = [], isLoading } = useQuery({
    queryKey: ['tanksWithStats', stationId],
    queryFn: () => stockService.getTanksWithStats(stationId),
    enabled: !!stationId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getLevelColor = (tank: TankWithStats) => {
    const percentage = (tank.currentLevel / tank.capacity) * 100;
    if (percentage <= tank.alertThreshold) return 'danger';
    if (percentage <= 30) return 'warning';
    return 'success';
  };

  const colorClasses = {
    success: { bg: 'bg-success-500', text: 'text-success-600', light: 'bg-success-50' },
    warning: { bg: 'bg-warning-500', text: 'text-warning-600', light: 'bg-warning-50' },
    danger: { bg: 'bg-danger-500', text: 'text-danger-600', light: 'bg-danger-50' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Etat du stock</h1>
          <p className="text-secondary-500">Vue d'ensemble des cuves et niveaux</p>
        </div>
      </div>

      {/* Tanks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank) => {
          const percentage = (tank.currentLevel / tank.capacity) * 100;
          const levelColor = getLevelColor(tank);
          const colors = colorClasses[levelColor];

          return (
            <div
              key={tank.id}
              className={`bg-white rounded-xl border-2 p-6 ${
                levelColor === 'danger' ? 'border-danger-300' : 'border-secondary-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tank.fuelType.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-secondary-900">{tank.reference}</h3>
                    <p className="text-sm text-secondary-500">{tank.fuelType.name}</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${colors.text}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>

              {/* Gauge */}
              <div className="relative h-32 bg-secondary-100 rounded-lg overflow-hidden mb-4">
                <div
                  className={`absolute bottom-0 left-0 right-0 ${colors.bg} transition-all duration-500`}
                  style={{ height: `${percentage}%` }}
                />
                {/* Alert threshold line */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-danger-400"
                  style={{ bottom: `${tank.alertThreshold}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white/90 px-3 py-1 rounded">
                    <p className="text-2xl font-bold text-secondary-900">{formatNumber(tank.currentLevel)} L</p>
                    <p className="text-xs text-secondary-500">sur {formatNumber(tank.capacity)} L</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className={`p-2 rounded-lg ${colors.light}`}>
                  <p className="text-secondary-600">Seuil alerte</p>
                  <p className="font-semibold text-secondary-900">{tank.alertThreshold}%</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary-50">
                  <p className="text-secondary-600">Conso./jour</p>
                  <p className="font-semibold text-secondary-900">{formatNumber(tank.averageConsumption)} L</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary-50">
                  <p className="text-secondary-600">Jours restants</p>
                  <p className={`font-semibold ${tank.daysOfStock <= 3 ? 'text-danger-600' : 'text-secondary-900'}`}>
                    {tank.daysOfStock} jour{tank.daysOfStock > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-secondary-50">
                  <p className="text-secondary-600">Derniere livr.</p>
                  <p className="font-semibold text-secondary-900">
                    {tank.lastDelivery ? formatDate(tank.lastDelivery.deliveryDate) : '-'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/operations/stock/ajustement?tankId=${tank.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span className="text-sm">Ajuster</span>
                </button>
                <button
                  onClick={() => navigate(`/operations/stock/mouvements?tankId=${tank.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span className="text-sm">Historique</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tanks.length === 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <TruckIcon className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-1">Aucune cuve</h3>
          <p className="text-sm text-secondary-500">Configurez vos cuves dans la section Gestion.</p>
        </div>
      )}
    </div>
  );
}
