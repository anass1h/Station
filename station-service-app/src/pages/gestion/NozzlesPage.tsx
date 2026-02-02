import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { nozzleService } from '@/services/nozzleService';
import { dispenserService } from '@/services/dispenserService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Nozzle {
  id: string;
  dispenserId: string;
  tankId: string;
  reference: string;
  position: number;
  currentIndex: number;
  isActive: boolean;
  dispenser?: {
    id: string;
    reference: string;
  };
  tank?: {
    id: string;
    reference: string;
    fuelType?: {
      id: string;
      name: string;
      color: string;
    };
  };
}

export function NozzlesPage() {
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

  const [search, setSearch] = useState('');
  const [selectedDispenser, setSelectedDispenser] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; nozzle: Nozzle | null }>({
    isOpen: false,
    nozzle: null,
  });

  const { data: dispensers = [] } = useQuery({
    queryKey: ['dispensers', stationId],
    queryFn: () => dispenserService.getByStation(stationId),
    enabled: !!stationId,
  });

  const { data: nozzles = [], isLoading } = useQuery<Nozzle[]>({
    queryKey: ['nozzles', stationId, selectedDispenser],
    queryFn: () => nozzleService.getByStation(stationId),
    enabled: !!stationId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nozzleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzles'] });
      setDeleteDialog({ isOpen: false, nozzle: null });
    },
  });

  const filteredNozzles = nozzles.filter((nozzle) => {
    const matchesSearch =
      nozzle.reference.toLowerCase().includes(search.toLowerCase()) ||
      nozzle.dispenser?.reference.toLowerCase().includes(search.toLowerCase()) ||
      nozzle.tank?.fuelType?.name.toLowerCase().includes(search.toLowerCase());

    const matchesDispenser = !selectedDispenser || nozzle.dispenserId === selectedDispenser;

    return matchesSearch && matchesDispenser;
  });

  const columns: Column<Nozzle>[] = [
    { key: 'reference', label: 'Reference', sortable: true },
    {
      key: 'dispenser',
      label: 'Distributeur',
      render: (n) => n.dispenser?.reference || '-',
    },
    {
      key: 'tank',
      label: 'Cuve',
      render: (n) => n.tank?.reference || '-',
    },
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (n) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: n.tank?.fuelType?.color || '#6b7280' }}
          />
          <span>{n.tank?.fuelType?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'currentIndex',
      label: 'Index actuel',
      sortable: true,
      render: (n) => `${n.currentIndex.toLocaleString('fr-FR')} L`,
    },
    {
      key: 'position',
      label: 'Position',
      render: (n) => `#${n.position}`,
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (n) => (
        <StatusBadge
          label={n.isActive ? 'Actif' : 'Inactif'}
          variant={n.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Nozzle>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (nozzle) => navigate(`/gestion/pistolets/${nozzle.id}`),
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (nozzle) => setDeleteDialog({ isOpen: true, nozzle }),
      variant: 'danger',
    },
  ];

  const dispenserOptions = dispensers.map((d) => ({ value: d.id, label: d.reference }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Pistolets</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Gerez les pistolets de distribution'}
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
            onClick={() => navigate('/gestion/pistolets/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau pistolet</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SelectField
          label=""
          options={[{ value: '', label: 'Tous les distributeurs' }, ...dispenserOptions]}
          value={selectedDispenser}
          onChange={setSelectedDispenser}
          className="w-full sm:w-64"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un pistolet..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredNozzles}
        loading={isLoading}
        keyExtractor={(n) => n.id}
        onRowClick={(nozzle) => navigate(`/gestion/pistolets/${nozzle.id}`)}
        actions={actions}
        emptyTitle="Aucun pistolet"
        emptyDescription="Commencez par ajouter un pistolet."
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, nozzle: null })}
        onConfirm={() => deleteDialog.nozzle && deleteMutation.mutate(deleteDialog.nozzle.id)}
        title="Supprimer le pistolet"
        message={`Voulez-vous vraiment supprimer le pistolet "${deleteDialog.nozzle?.reference}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
