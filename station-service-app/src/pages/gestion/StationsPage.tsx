import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { stationService, Station } from '@/services/stationService';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function StationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    station: Station | null;
    action: 'activate' | 'deactivate';
  }>({ isOpen: false, station: null, action: 'deactivate' });

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      stationService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      setConfirmDialog({ isOpen: false, station: null, action: 'deactivate' });
    },
  });

  const filteredStations = stations.filter((station) => {
    const searchLower = search.toLowerCase();
    return (
      station.name.toLowerCase().includes(searchLower) ||
      station.city.toLowerCase().includes(searchLower) ||
      station.phone?.toLowerCase().includes(searchLower) ||
      station.email?.toLowerCase().includes(searchLower)
    );
  });

  const columns: Column<Station>[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'city', label: 'Ville', sortable: true },
    { key: 'phone', label: 'Telephone', render: (s) => s.phone || '-' },
    { key: 'email', label: 'Email', render: (s) => s.email || '-' },
    {
      key: 'isActive',
      label: 'Statut',
      render: (s) => (
        <StatusBadge
          label={s.isActive ? 'Actif' : 'Inactif'}
          variant={s.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Station>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (station) => navigate(`/gestion/stations/${station.id}`),
    },
    {
      icon: NoSymbolIcon,
      label: 'Desactiver',
      onClick: (station) =>
        setConfirmDialog({ isOpen: true, station, action: 'deactivate' }),
      variant: 'danger',
      hidden: (station) => !station.isActive,
    },
    {
      icon: CheckCircleIcon,
      label: 'Activer',
      onClick: (station) =>
        setConfirmDialog({ isOpen: true, station, action: 'activate' }),
      hidden: (station) => station.isActive,
    },
  ];

  const handleConfirmToggle = () => {
    if (confirmDialog.station) {
      toggleMutation.mutate({
        id: confirmDialog.station.id,
        isActive: confirmDialog.action === 'activate',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Stations</h1>
          <p className="text-secondary-500">Gerez vos stations-service</p>
        </div>
        <button
          onClick={() => navigate('/gestion/stations/nouveau')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nouvelle station</span>
        </button>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une station..."
        className="max-w-md"
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStations}
        loading={isLoading}
        keyExtractor={(s) => s.id}
        onRowClick={(station) => navigate(`/gestion/stations/${station.id}`)}
        actions={actions}
        emptyTitle="Aucune station"
        emptyDescription="Commencez par creer votre premiere station-service."
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, station: null, action: 'deactivate' })}
        onConfirm={handleConfirmToggle}
        title={confirmDialog.action === 'activate' ? 'Activer la station' : 'Desactiver la station'}
        message={
          confirmDialog.action === 'activate'
            ? `Voulez-vous activer la station "${confirmDialog.station?.name}" ?`
            : `Voulez-vous desactiver la station "${confirmDialog.station?.name}" ? Les pompistes ne pourront plus se connecter.`
        }
        confirmLabel={confirmDialog.action === 'activate' ? 'Activer' : 'Desactiver'}
        variant={confirmDialog.action === 'activate' ? 'info' : 'danger'}
        loading={toggleMutation.isPending}
      />
    </div>
  );
}
