import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, ClockIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { priceService, Price } from '@/services/priceService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function PricesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedStationId, setSelectedStationId] = useState<string>(user?.stationId || '');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState<string | null>(null);

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

  const { data: currentPrices = [], isLoading: loadingCurrent } = useQuery({
    queryKey: ['prices', 'current', stationId],
    queryFn: () => priceService.getCurrentPrices(stationId),
    enabled: !!stationId,
  });

  const { data: priceHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['prices', 'history', stationId, selectedFuelType],
    queryFn: () => priceService.getPriceHistory(stationId, selectedFuelType || undefined),
    enabled: !!stationId && showHistory,
  });

  const columns: Column<Price>[] = [
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (p) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: p.fuelType?.color || '#6b7280' }}
          />
          <span className="font-medium">{p.fuelType?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'sellingPriceTTC',
      label: 'Prix vente TTC',
      render: (p) => (
        <span className="font-semibold text-primary-600">
          {Number(p.sellingPriceTTC).toFixed(2)} MAD/L
        </span>
      ),
    },
    {
      key: 'sellingPriceHT',
      label: 'Prix vente HT',
      render: (p) => `${Number(p.sellingPriceHT).toFixed(2)} MAD/L`,
    },
    {
      key: 'purchasePrice',
      label: "Prix d'achat",
      render: (p) => `${Number(p.purchasePrice).toFixed(2)} MAD/L`,
    },
    {
      key: 'margin',
      label: 'Marge',
      render: (p) => {
        const margin = Number(p.sellingPriceHT) - Number(p.purchasePrice);
        return (
          <span className={margin > 0 ? 'text-success-600' : 'text-danger-600'}>
            {margin.toFixed(2)} MAD/L
          </span>
        );
      },
    },
    {
      key: 'effectiveFrom',
      label: 'Depuis le',
      render: (p) => new Date(p.effectiveFrom).toLocaleDateString('fr-FR'),
    },
  ];

  const historyColumns: Column<Price>[] = [
    ...columns,
    {
      key: 'effectiveTo',
      label: "Jusqu'au",
      render: (p) =>
        p.effectiveTo ? new Date(p.effectiveTo).toLocaleDateString('fr-FR') : 'En cours',
    },
  ];

  if (loadingCurrent) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Prix des carburants</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Gerez les prix de vente et d\'achat'}
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
            onClick={() => navigate('/gestion/prix/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Modifier les prix</span>
          </button>
        </div>
      </div>

      {/* Current Prices */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Prix actuels</h2>
        <DataTable
          columns={columns}
          data={currentPrices}
          loading={loadingCurrent}
          keyExtractor={(p) => p.id}
          emptyTitle="Aucun prix configure"
          emptyDescription="Configurez les prix de vente pour chaque carburant."
        />
      </div>

      {/* History Toggle */}
      <div className="border-t border-secondary-200 pt-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
        >
          <ClockIcon className="h-5 w-5" />
          <span>{showHistory ? 'Masquer l\'historique' : 'Afficher l\'historique des prix'}</span>
        </button>

        {showHistory && (
          <div className="mt-4">
            {/* Filter by fuel type */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedFuelType(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  !selectedFuelType
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Tous
              </button>
              {currentPrices.map((price) => (
                <button
                  key={price.fuelTypeId}
                  onClick={() => setSelectedFuelType(price.fuelTypeId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedFuelType === price.fuelTypeId
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: price.fuelType?.color }}
                  />
                  {price.fuelType?.name}
                </button>
              ))}
            </div>

            <DataTable
              columns={historyColumns}
              data={priceHistory}
              loading={loadingHistory}
              keyExtractor={(p) => p.id}
              emptyTitle="Aucun historique"
              emptyDescription="L'historique des prix apparaitra ici."
            />
          </div>
        )}
      </div>
    </div>
  );
}
