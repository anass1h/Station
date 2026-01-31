import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { tankService, Tank } from '@/services/tankService';
import { stationService } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function TanksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>(user?.stationId || '');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tank: Tank | null }>({
    isOpen: false,
    tank: null,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  const { data: tanks = [], isLoading } = useQuery({
    queryKey: ['tanks', selectedStation],
    queryFn: () => tankService.getAll(selectedStation || undefined),
    enabled: !!selectedStation || isSuperAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tankService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      setDeleteDialog({ isOpen: false, tank: null });
    },
  });

  const filteredTanks = tanks.filter((tank) => {
    const searchLower = search.toLowerCase();
    return (
      tank.reference.toLowerCase().includes(searchLower) ||
      tank.fuelType?.name.toLowerCase().includes(searchLower)
    );
  });

  const getLevelColor = (tank: Tank) => {
    const percentage = (tank.currentLevel / tank.capacity) * 100;
    if (percentage <= tank.alertThreshold) return 'danger';
    if (percentage <= 30) return 'warning';
    return 'success';
  };

  const columns: Column<Tank>[] = [
    { key: 'reference', label: 'Reference', sortable: true },
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (t) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: t.fuelType?.color || '#6b7280' }}
          />
          <span>{t.fuelType?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacite',
      sortable: true,
      render: (t) => `${t.capacity.toLocaleString('fr-FR')} L`,
    },
    {
      key: 'currentLevel',
      label: 'Niveau actuel',
      render: (t) => {
        const percentage = (t.currentLevel / t.capacity) * 100;
        const color = getLevelColor(t);
        const colorClasses = {
          success: 'bg-success-500',
          warning: 'bg-warning-500',
          danger: 'bg-danger-500',
        };
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{t.currentLevel.toLocaleString('fr-FR')} L</span>
              <span className="text-secondary-500">{percentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colorClasses[color]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'alertThreshold',
      label: 'Seuil alerte',
      render: (t) => `${t.alertThreshold}%`,
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (t) => (
        <StatusBadge
          label={t.isActive ? 'Actif' : 'Inactif'}
          variant={t.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Tank>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (tank) => navigate(`/gestion/cuves/${tank.id}`),
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (tank) => setDeleteDialog({ isOpen: true, tank }),
      variant: 'danger',
    },
  ];

  const stationOptions = stations.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Cuves</h1>
          <p className="text-secondary-500">Gerez les cuves de stockage</p>
        </div>
        <button
          onClick={() => navigate('/gestion/cuves/nouveau')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nouvelle cuve</span>
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
          placeholder="Rechercher une cuve..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTanks}
        loading={isLoading}
        keyExtractor={(t) => t.id}
        onRowClick={(tank) => navigate(`/gestion/cuves/${tank.id}`)}
        actions={actions}
        emptyTitle="Aucune cuve"
        emptyDescription="Commencez par ajouter une cuve de stockage."
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, tank: null })}
        onConfirm={() => deleteDialog.tank && deleteMutation.mutate(deleteDialog.tank.id)}
        title="Supprimer la cuve"
        message={`Voulez-vous vraiment supprimer la cuve "${deleteDialog.tank?.reference}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
