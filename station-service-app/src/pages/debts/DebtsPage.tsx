import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { debtService, PompisteDebt, DebtStatus, DebtReason } from '@/services/debtService';
import { userService } from '@/services/userService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DebtPaymentModal, DebtsByPompisteCard } from '@/components/debts';
import { formatCurrency, formatDate } from '@/utils/exportExcel';

type ViewMode = 'list' | 'grouped';

export function DebtsPage() {
  const navigate = useNavigate();
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

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    pompisteId: '',
    status: '' as DebtStatus | '',
    reason: '' as DebtReason | '',
  });
  const [selectedDebt, setSelectedDebt] = useState<PompisteDebt | null>(null);

  const { data: overview } = useQuery({
    queryKey: ['debtsOverview', stationId],
    queryFn: () => debtService.getDebtsOverview(stationId),
    enabled: !!stationId,
  });

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts', stationId, filters],
    queryFn: () => debtService.getDebts(stationId, {
      pompisteId: filters.pompisteId || undefined,
      status: filters.status || undefined,
      reason: filters.reason || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: groupedDebts = [] } = useQuery({
    queryKey: ['debtsGrouped', stationId],
    queryFn: () => debtService.getDebtsGroupedByPompiste(stationId),
    enabled: !!stationId && viewMode === 'grouped',
  });

  const { data: pompistes = [] } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const columns: Column<PompisteDebt>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (d) => formatDate(d.createdAt),
    },
    {
      key: 'pompiste',
      label: 'Pompiste',
      render: (d) => d.pompiste ? `${d.pompiste.firstName} ${d.pompiste.lastName}` : '-',
    },
    {
      key: 'reason',
      label: 'Raison',
      render: (d) => debtService.getReasonLabel(d.reason),
    },
    {
      key: 'initialAmount',
      label: 'Initial',
      render: (d) => formatCurrency(Number(d.initialAmount)),
    },
    {
      key: 'remainingAmount',
      label: 'Reste du',
      render: (d) => (
        <span className={Number(d.remainingAmount) > 0 ? 'text-danger-600 font-medium' : 'text-success-600'}>
          {formatCurrency(Number(d.remainingAmount))}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (d) => {
        const config = debtService.getStatusConfig(d.status);
        return <StatusBadge label={config.label} variant={config.variant} dot />;
      },
    },
  ];

  const pompisteOptions = pompistes.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
  }));

  const statusOptions = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'PARTIALLY_PAID', label: 'Partiellement payee' },
    { value: 'PAID', label: 'Payee' },
    { value: 'CANCELLED', label: 'Annulee' },
  ];

  const reasonOptions = [
    { value: 'CASH_VARIANCE', label: 'Écart de caisse' },
    { value: 'SALARY_ADVANCE', label: 'Avance sur salaire' },
    { value: 'DAMAGE', label: 'Casse/Dégât' },
    { value: 'FUEL_LOSS', label: 'Perte carburant' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dettes pompistes</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Gestion des dettes et remboursements'}
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
          <button
            onClick={() => navigate('/dettes/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvelle dette</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-100 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total dettes en cours</p>
                <p className="text-xl font-bold text-danger-600">{formatCurrency(Number(overview.totalDebt))}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Pompistes endettes</p>
                <p className="text-xl font-bold text-warning-600">{overview.debtorsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Dette moyenne</p>
                <p className="text-xl font-bold text-secondary-900">{formatCurrency(Number(overview.averageDebt))}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="Pompiste"
              options={[{ value: '', label: 'Tous' }, ...pompisteOptions]}
              value={filters.pompisteId}
              onChange={(v) => setFilters({ ...filters, pompisteId: v })}
              searchable
            />
            <SelectField
              label="Statut"
              options={[{ value: '', label: 'Tous' }, ...statusOptions]}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v as DebtStatus | '' })}
            />
            <SelectField
              label="Raison"
              options={[{ value: '', label: 'Toutes' }, ...reasonOptions]}
              value={filters.reason}
              onChange={(v) => setFilters({ ...filters, reason: v as DebtReason | '' })}
            />
          </div>
          <button
            onClick={() => setFilters({ pompisteId: '', status: '', reason: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-secondary-300 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <ListBulletIcon className="h-4 w-4" />
            <span>Liste</span>
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'grouped'
                ? 'bg-primary-600 text-white'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <Squares2X2Icon className="h-4 w-4" />
            <span>Par pompiste</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={debts}
          loading={isLoading}
          keyExtractor={(d) => d.id}
          onRowClick={(debt) => navigate(`/dettes/${debt.id}`)}
          emptyTitle="Aucune dette"
          emptyDescription="Aucune dette enregistree."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedDebts
            .sort((a, b) => b.totalDebt - a.totalDebt)
            .map((group) => (
              <DebtsByPompisteCard key={group.pompisteId} data={group} />
            ))}
          {groupedDebts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-secondary-500">Aucun pompiste endette</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {selectedDebt && (
        <DebtPaymentModal
          debt={selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onSuccess={() => setSelectedDebt(null)}
        />
      )}
    </div>
  );
}
