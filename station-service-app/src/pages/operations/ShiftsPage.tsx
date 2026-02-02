import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  CheckBadgeIcon,
  FunnelIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { shiftOperationsService, ShiftSummary, ShiftStatus } from '@/services/shiftOperationsService';
import { userService } from '@/services/userService';
import { nozzleService } from '@/services/nozzleService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToExcel, formatDateTime, formatCurrency, formatNumber } from '@/utils/exportExcel';

const statusConfig: Record<ShiftStatus, { label: string; variant: 'info' | 'warning' | 'success' }> = {
  OPEN: { label: 'En cours', variant: 'info' },
  CLOSED: { label: 'Cloture', variant: 'warning' },
  VALIDATED: { label: 'Valide', variant: 'success' },
};

export function ShiftsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    startDate: '',
    endDate: '',
    pompisteId: '',
    nozzleId: '',
    status: '' as ShiftStatus | '',
  });
  const [validateDialog, setValidateDialog] = useState<{ isOpen: boolean; shift: ShiftSummary | null }>({
    isOpen: false,
    shift: null,
  });

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', stationId, filters],
    queryFn: () => shiftOperationsService.getShifts(stationId, {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      pompisteId: filters.pompisteId || undefined,
      nozzleId: filters.nozzleId || undefined,
      status: filters.status || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: pompistes = [] } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const { data: nozzles = [] } = useQuery({
    queryKey: ['nozzles', stationId],
    queryFn: () => nozzleService.getByStation(stationId),
    enabled: !!stationId,
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => shiftOperationsService.validateShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setValidateDialog({ isOpen: false, shift: null });
    },
  });

  const handleExport = () => {
    exportToExcel(shifts, 'shifts', [
      { key: 'startTime', label: 'Date', format: (v) => formatDateTime(v as string) },
      { key: 'pompiste', label: 'Pompiste', format: (_, item) => `${(item as ShiftSummary).pompiste.firstName} ${(item as ShiftSummary).pompiste.lastName}` },
      { key: 'nozzle.reference', label: 'Pistolet' },
      { key: 'nozzle.tank.fuelType.name', label: 'Carburant' },
      { key: 'startTime', label: 'Debut', format: (v) => new Date(v as string).toLocaleTimeString('fr-FR') },
      { key: 'endTime', label: 'Fin', format: (v) => v ? new Date(v as string).toLocaleTimeString('fr-FR') : '-' },
      { key: 'totalLiters', label: 'Litres', format: (v) => formatNumber(v as number) },
      { key: 'totalAmount', label: 'CA', format: (v) => formatCurrency(v as number) },
      { key: 'status', label: 'Statut', format: (v) => statusConfig[v as ShiftStatus].label },
    ]);
  };

  const columns: Column<ShiftSummary>[] = [
    {
      key: 'startTime',
      label: 'Date',
      sortable: true,
      render: (s) => formatDateTime(s.startTime),
    },
    {
      key: 'pompiste',
      label: 'Pompiste',
      render: (s) => `${s.pompiste.firstName} ${s.pompiste.lastName}`,
    },
    {
      key: 'nozzle',
      label: 'Pistolet',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: s.nozzle.tank?.fuelType?.color || '#6b7280' }}
          />
          <span>{s.nozzle.reference}</span>
        </div>
      ),
    },
    {
      key: 'times',
      label: 'Horaires',
      render: (s) => (
        <span className="text-sm">
          {new Date(s.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {s.endTime
            ? new Date(s.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : 'En cours'}
        </span>
      ),
    },
    {
      key: 'totalLiters',
      label: 'Litres',
      sortable: true,
      render: (s) => `${formatNumber(s.totalLiters)} L`,
    },
    {
      key: 'totalAmount',
      label: 'CA',
      sortable: true,
      render: (s) => <span className="font-medium">{formatCurrency(s.totalAmount)}</span>,
    },
    {
      key: 'status',
      label: 'Statut',
      render: (s) => {
        const config = statusConfig[s.status];
        return <StatusBadge label={config.label} variant={config.variant} dot />;
      },
    },
  ];

  const actions: TableAction<ShiftSummary>[] = [
    {
      icon: EyeIcon,
      label: 'Voir detail',
      onClick: (shift) => navigate(`/operations/shifts/${shift.id}`),
    },
    {
      icon: CheckBadgeIcon,
      label: 'Valider',
      onClick: (shift) => setValidateDialog({ isOpen: true, shift }),
      hidden: (shift) => shift.status !== 'CLOSED',
    },
  ];

  const pompisteOptions = pompistes.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }));
  const nozzleOptions = nozzles.map((n) => ({ value: n.id, label: n.reference }));
  const statusOptions = [
    { value: 'OPEN', label: 'En cours' },
    { value: 'CLOSED', label: 'Cloture' },
    { value: 'VALIDATED', label: 'Valide' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Shifts</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Historique et gestion des shifts'}
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
            onClick={handleExport}
            disabled={shifts.length === 0}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              label="Pistolet"
              options={[{ value: '', label: 'Tous' }, ...nozzleOptions]}
              value={filters.nozzleId}
              onChange={(v) => setFilters({ ...filters, nozzleId: v })}
            />
            <SelectField
              label="Statut"
              options={[{ value: '', label: 'Tous' }, ...statusOptions]}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v as ShiftStatus | '' })}
            />
          </div>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', pompisteId: '', nozzleId: '', status: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={shifts}
        loading={isLoading}
        keyExtractor={(s) => s.id}
        onRowClick={(shift) => navigate(`/operations/shifts/${shift.id}`)}
        actions={actions}
        emptyTitle="Aucun shift"
        emptyDescription="Aucun shift trouve avec les filtres selectionnes."
      />

      {/* Validate Dialog */}
      <ConfirmDialog
        isOpen={validateDialog.isOpen}
        onClose={() => setValidateDialog({ isOpen: false, shift: null })}
        onConfirm={() => validateDialog.shift && validateMutation.mutate(validateDialog.shift.id)}
        title="Valider le shift"
        message={`Voulez-vous valider le shift de ${validateDialog.shift?.pompiste.firstName} ${validateDialog.shift?.pompiste.lastName} ?`}
        confirmLabel="Valider"
        variant="info"
        loading={validateMutation.isPending}
      />
    </div>
  );
}
