import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { salesOperationsService, SaleSummary } from '@/services/salesOperationsService';
import { userService } from '@/services/userService';
import { fuelTypeService } from '@/services/fuelTypeService';
import { clientService } from '@/services/clientService';
import { paymentMethodService } from '@/services/paymentMethodService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { exportToExcel, formatDateTime, formatCurrency, formatNumber } from '@/utils/exportExcel';

export function SalesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pompisteId: '',
    fuelTypeId: '',
    clientId: '',
    paymentMethodId: '',
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', stationId, filters],
    queryFn: () => salesOperationsService.getSales(stationId, {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      pompisteId: filters.pompisteId || undefined,
      fuelTypeId: filters.fuelTypeId || undefined,
      clientId: filters.clientId || undefined,
      paymentMethodId: filters.paymentMethodId || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: pompistes = [] } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: fuelTypeService.getActive,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', stationId],
    queryFn: () => clientService.getAll(stationId),
    enabled: !!stationId,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodService.getAll,
  });

  const handleExport = () => {
    exportToExcel(sales, 'ventes', [
      { key: 'saleTime', label: 'Date/Heure', format: (v) => formatDateTime(v as string) },
      { key: 'pompiste', label: 'Pompiste', format: (_, item) => `${(item as SaleSummary).pompiste.firstName} ${(item as SaleSummary).pompiste.lastName}` },
      { key: 'fuelType.name', label: 'Carburant' },
      { key: 'quantity', label: 'Litres', format: (v) => formatNumber(v as number) },
      { key: 'unitPrice', label: 'PU', format: (v) => formatNumber(v as number, 2) },
      { key: 'totalAmount', label: 'Total', format: (v) => formatCurrency(v as number) },
      { key: 'payments', label: 'Paiement', format: (_, item) => (item as SaleSummary).payments.map(p => p.paymentMethod.name).join(', ') },
      { key: 'client', label: 'Client', format: (_, item) => (item as SaleSummary).client?.companyName || (item as SaleSummary).client?.contactName || '' },
    ]);
  };

  const totalLiters = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  const columns: Column<SaleSummary>[] = [
    {
      key: 'saleTime',
      label: 'Date/Heure',
      sortable: true,
      render: (s) => formatDateTime(s.saleTime),
    },
    {
      key: 'pompiste',
      label: 'Pompiste',
      render: (s) => `${s.pompiste.firstName} ${s.pompiste.lastName}`,
    },
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: s.fuelType.color }}
          />
          <span>{s.fuelType.name}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Litres',
      sortable: true,
      render: (s) => `${formatNumber(s.quantity)} L`,
    },
    {
      key: 'unitPrice',
      label: 'PU',
      render: (s) => `${formatNumber(s.unitPrice)} MAD`,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (s) => <span className="font-medium">{formatCurrency(s.totalAmount)}</span>,
    },
    {
      key: 'payments',
      label: 'Paiement',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.payments.map((p, i) => (
            <span key={i} className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded text-xs">
              {p.paymentMethod.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (s) => s.client?.companyName || s.client?.contactName || '-',
    },
  ];

  const pompisteOptions = pompistes.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }));
  const fuelTypeOptions = fuelTypes.map((f) => ({ value: f.id, label: f.name }));
  const clientOptions = clients.map((c) => ({ value: c.id, label: c.companyName || c.contactName }));
  const paymentMethodOptions = paymentMethods.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Ventes</h1>
          <p className="text-secondary-500">Historique des ventes</p>
        </div>
        <div className="flex gap-2">
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
            onClick={handleExport}
            disabled={sales.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
            <SelectField
              label="Carburant"
              options={[{ value: '', label: 'Tous' }, ...fuelTypeOptions]}
              value={filters.fuelTypeId}
              onChange={(v) => setFilters({ ...filters, fuelTypeId: v })}
            />
            <SelectField
              label="Client"
              options={[{ value: '', label: 'Tous' }, ...clientOptions]}
              value={filters.clientId}
              onChange={(v) => setFilters({ ...filters, clientId: v })}
              searchable
            />
            <SelectField
              label="Paiement"
              options={[{ value: '', label: 'Tous' }, ...paymentMethodOptions]}
              value={filters.paymentMethodId}
              onChange={(v) => setFilters({ ...filters, paymentMethodId: v })}
            />
          </div>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', pompisteId: '', fuelTypeId: '', clientId: '', paymentMethodId: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={sales}
        loading={isLoading}
        keyExtractor={(s) => s.id}
        onRowClick={(sale) => navigate(`/operations/ventes/${sale.id}`)}
        emptyTitle="Aucune vente"
        emptyDescription="Aucune vente trouvee avec les filtres selectionnes."
      />

      {/* Totals */}
      {sales.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex flex-wrap justify-end gap-8">
            <div className="text-right">
              <p className="text-sm text-primary-600">Total litres</p>
              <p className="text-xl font-bold text-primary-700">{formatNumber(totalLiters)} L</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Total montant</p>
              <p className="text-xl font-bold text-primary-700">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
