import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { deliveryService, Delivery } from '@/services/deliveryService';
import { supplierService } from '@/services/supplierService';
import { tankService } from '@/services/tankService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { exportToExcel, formatDate, formatCurrency, formatNumber } from '@/utils/exportExcel';

export function DeliveriesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supplierId: '',
    tankId: '',
  });

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries', stationId, filters],
    queryFn: () => deliveryService.getAll(stationId, {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      supplierId: filters.supplierId || undefined,
      tankId: filters.tankId || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', stationId],
    queryFn: () => supplierService.getByStation(stationId),
    enabled: !!stationId,
  });

  const { data: tanks = [] } = useQuery({
    queryKey: ['tanks', stationId],
    queryFn: () => tankService.getByStation(stationId),
    enabled: !!stationId,
  });

  const handleExport = () => {
    exportToExcel(deliveries, 'livraisons', [
      { key: 'deliveryDate', label: 'Date', format: (v) => formatDate(v as string) },
      { key: 'deliveryNumber', label: 'N° BL' },
      { key: 'supplier.name', label: 'Fournisseur' },
      { key: 'tank.reference', label: 'Cuve' },
      { key: 'tank.fuelType.name', label: 'Carburant' },
      { key: 'quantity', label: 'Litres', format: (v) => formatNumber(v as number) },
      { key: 'purchasePrice', label: 'PU', format: (v) => formatNumber(v as number, 2) },
      { key: 'totalAmount', label: 'Total', format: (v) => formatCurrency(v as number) },
      { key: 'receivedBy', label: 'Recu par', format: (_, item) => `${(item as Delivery).receivedBy?.firstName} ${(item as Delivery).receivedBy?.lastName}` },
    ]);
  };

  const totalLiters = deliveries.reduce((sum, d) => sum + d.quantity, 0);
  const totalAmount = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);

  const columns: Column<Delivery>[] = [
    {
      key: 'deliveryDate',
      label: 'Date',
      sortable: true,
      render: (d) => formatDate(d.deliveryDate),
    },
    {
      key: 'deliveryNumber',
      label: 'N° BL',
      render: (d) => <span className="font-mono">{d.deliveryNumber}</span>,
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      render: (d) => d.supplier?.name || '-',
    },
    {
      key: 'tank',
      label: 'Cuve',
      render: (d) => d.tank?.reference || '-',
    },
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (d) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: d.tank?.fuelType?.color || '#6b7280' }}
          />
          <span>{d.tank?.fuelType?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Litres',
      sortable: true,
      render: (d) => `${formatNumber(d.quantity)} L`,
    },
    {
      key: 'purchasePrice',
      label: 'PU',
      render: (d) => `${formatNumber(d.purchasePrice)} MAD`,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (d) => <span className="font-medium">{formatCurrency(d.totalAmount)}</span>,
    },
    {
      key: 'receivedBy',
      label: 'Recu par',
      render: (d) => d.receivedBy ? `${d.receivedBy.firstName} ${d.receivedBy.lastName}` : '-',
    },
  ];

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const tankOptions = tanks.map((t) => ({ value: t.id, label: `${t.reference} - ${t.fuelType?.name || 'N/A'}` }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Livraisons</h1>
          <p className="text-secondary-500">Historique des livraisons de carburant</p>
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
            disabled={deliveries.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 bg-white text-secondary-700 rounded-lg hover:bg-secondary-50 disabled:opacity-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/operations/livraisons/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvelle livraison</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              label="Fournisseur"
              options={[{ value: '', label: 'Tous' }, ...supplierOptions]}
              value={filters.supplierId}
              onChange={(v) => setFilters({ ...filters, supplierId: v })}
            />
            <SelectField
              label="Cuve"
              options={[{ value: '', label: 'Toutes' }, ...tankOptions]}
              value={filters.tankId}
              onChange={(v) => setFilters({ ...filters, tankId: v })}
            />
          </div>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', supplierId: '', tankId: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={deliveries}
        loading={isLoading}
        keyExtractor={(d) => d.id}
        emptyTitle="Aucune livraison"
        emptyDescription="Aucune livraison trouvee avec les filtres selectionnes."
      />

      {/* Totals */}
      {deliveries.length > 0 && (
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
