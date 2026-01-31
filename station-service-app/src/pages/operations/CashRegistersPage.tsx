import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { shiftOperationsService, CashRegisterSummary } from '@/services/shiftOperationsService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { formatDateTime, formatCurrency } from '@/utils/exportExcel';

export function CashRegistersPage() {
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pompisteId: '',
  });
  const [selectedRegister, setSelectedRegister] = useState<CashRegisterSummary | null>(null);

  const { data: registers = [], isLoading } = useQuery({
    queryKey: ['cashRegisters', stationId, filters],
    queryFn: () => shiftOperationsService.getCashRegisters(stationId, {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      pompisteId: filters.pompisteId || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: pompistes = [] } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-success-600';
    if (Math.abs(variance) < 50) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getVarianceBg = (variance: number) => {
    if (variance === 0) return 'bg-success-50';
    if (Math.abs(variance) < 50) return 'bg-warning-50';
    return 'bg-danger-50';
  };

  const columns: Column<CashRegisterSummary>[] = [
    {
      key: 'closedAt',
      label: 'Date',
      sortable: true,
      render: (r) => formatDateTime(r.closedAt),
    },
    {
      key: 'pompiste',
      label: 'Pompiste',
      render: (r) => `${r.pompiste.firstName} ${r.pompiste.lastName}`,
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (r) => (
        <span className="text-sm">
          {new Date(r.shift.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {new Date(r.shift.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'expectedAmount',
      label: 'Attendu',
      render: (r) => formatCurrency(r.expectedAmount),
    },
    {
      key: 'declaredAmount',
      label: 'Declare',
      render: (r) => formatCurrency(r.declaredAmount),
    },
    {
      key: 'variance',
      label: 'Ecart',
      render: (r) => (
        <span className={`font-medium ${getVarianceColor(r.variance)}`}>
          {r.variance > 0 ? '+' : ''}{formatCurrency(r.variance)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVarianceBg(r.variance)} ${getVarianceColor(r.variance)}`}>
          {r.variance === 0 ? 'OK' : Math.abs(r.variance) < 50 ? 'Ecart mineur' : 'Ecart important'}
        </span>
      ),
    },
  ];

  const pompisteOptions = pompistes.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clotures de caisse</h1>
          <p className="text-secondary-500">Historique des clotures et ecarts</p>
        </div>
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Date debut</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <SelectField
              label="Pompiste"
              options={[{ value: '', label: 'Tous' }, ...pompisteOptions]}
              value={filters.pompisteId}
              onChange={(v) => setFilters({ ...filters, pompisteId: v })}
            />
          </div>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', pompisteId: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={registers}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        onRowClick={(register) => setSelectedRegister(register)}
        emptyTitle="Aucune cloture"
        emptyDescription="Aucune cloture de caisse trouvee."
      />

      {/* Detail Modal */}
      {selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedRegister(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Detail de la cloture
            </h3>

            {/* Info */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-secondary-600">Pompiste</span>
                <span className="font-medium">{selectedRegister.pompiste.firstName} {selectedRegister.pompiste.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Date</span>
                <span className="font-medium">{formatDateTime(selectedRegister.closedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Shift</span>
                <span className="font-medium">
                  {formatCurrency(selectedRegister.shift.totalAmount)} ({selectedRegister.shift.totalLiters.toFixed(0)} L)
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-secondary-200 pt-4 mb-6">
              <h4 className="font-medium text-secondary-900 mb-3">Ventilation par moyen de paiement</h4>
              <div className="space-y-2">
                {selectedRegister.details.map((detail, index) => (
                  <div key={index} className={`flex justify-between p-3 rounded-lg ${getVarianceBg(detail.variance)}`}>
                    <span className="font-medium">{detail.paymentMethod}</span>
                    <div className="text-right">
                      <div className="text-sm text-secondary-600">
                        Attendu: {formatCurrency(detail.expected)} / Declare: {formatCurrency(detail.declared)}
                      </div>
                      <div className={`font-semibold ${getVarianceColor(detail.variance)}`}>
                        Ecart: {detail.variance > 0 ? '+' : ''}{formatCurrency(detail.variance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className={`p-4 rounded-lg ${getVarianceBg(selectedRegister.variance)}`}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-secondary-600">Attendu</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedRegister.expectedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Declare</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedRegister.declaredAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Ecart</p>
                  <p className={`text-lg font-bold ${getVarianceColor(selectedRegister.variance)}`}>
                    {selectedRegister.variance > 0 ? '+' : ''}{formatCurrency(selectedRegister.variance)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRegister(null)}
              className="w-full mt-6 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
