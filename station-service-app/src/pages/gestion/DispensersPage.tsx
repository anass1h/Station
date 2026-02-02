import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { dispenserService, Dispenser } from '@/services/dispenserService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function DispensersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>(user?.stationId || '');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; dispenser: Dispenser | null }>({
    isOpen: false,
    dispenser: null,
  });

  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  // Auto-select first station for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin && !selectedStation && stations.length > 0) {
      setSelectedStation(stations[0].id);
    }
  }, [isSuperAdmin, selectedStation, stations]);

  const { data: dispensers = [], isLoading } = useQuery({
    queryKey: ['dispensers', selectedStation],
    queryFn: () => dispenserService.getAll(selectedStation || undefined),
    enabled: !!selectedStation || isSuperAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dispenserService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispensers'] });
      setDeleteDialog({ isOpen: false, dispenser: null });
    },
  });

  const filteredDispensers = dispensers.filter((dispenser) => {
    const searchLower = search.toLowerCase();
    return dispenser.reference.toLowerCase().includes(searchLower);
  });

  const columns: Column<Dispenser>[] = [
    { key: 'reference', label: 'Reference', sortable: true },
    {
      key: 'station',
      label: 'Station',
      render: (d) => d.station?.name || '-',
      className: isSuperAdmin ? '' : 'hidden',
    },
    {
      key: 'nozzlesCount',
      label: 'Pistolets',
      render: (d) => (
        <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
          {d._count?.nozzles || d.nozzles?.length || 0} pistolet(s)
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (d) => (
        <StatusBadge
          label={d.isActive ? 'Actif' : 'Inactif'}
          variant={d.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Dispenser>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (dispenser) => navigate(`/gestion/distributeurs/${dispenser.id}`),
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (dispenser) => setDeleteDialog({ isOpen: true, dispenser }),
      variant: 'danger',
    },
  ];

  const stationOptions = stations.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Distributeurs</h1>
          <p className="text-secondary-500">Gerez les distributeurs de carburant</p>
        </div>
        <button
          onClick={() => navigate('/gestion/distributeurs/nouveau')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nouveau distributeur</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {isSuperAdmin && (
          <SelectField
            label=""
            options={[{ value: '', label: 'Toutes les stations' }, ...stationOptions]}
            value={selectedStation}
            onChange={setSelectedStation}
            className="w-full sm:w-64"
          />
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un distributeur..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredDispensers}
        loading={isLoading}
        keyExtractor={(d) => d.id}
        onRowClick={(dispenser) => navigate(`/gestion/distributeurs/${dispenser.id}`)}
        actions={actions}
        emptyTitle="Aucun distributeur"
        emptyDescription="Commencez par ajouter un distributeur."
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, dispenser: null })}
        onConfirm={() => deleteDialog.dispenser && deleteMutation.mutate(deleteDialog.dispenser.id)}
        title="Supprimer le distributeur"
        message={`Voulez-vous vraiment supprimer le distributeur "${deleteDialog.dispenser?.reference}" ? Tous les pistolets associes seront egalement supprimes.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
