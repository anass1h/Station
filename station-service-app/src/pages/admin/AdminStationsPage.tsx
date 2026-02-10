import { useState, useEffect, useCallback, useMemo } from 'react';
import { stationService, type Station } from '@/services/stationService';
import { DataTable, type Column, type TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'toggle' | 'delete';
    station: Station | null;
  }>({ isOpen: false, type: 'toggle', station: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stationService.getAll();
      setStations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des stations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }, [stations, search]);

  const handleToggleActive = async () => {
    const station = confirmDialog.station;
    if (!station) return;
    setActionLoading(true);
    try {
      await stationService.toggleActive(station.id, !station.isActive);
      setConfirmDialog({ isOpen: false, type: 'toggle', station: null });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const station = confirmDialog.station;
    if (!station) return;
    setActionLoading(true);
    try {
      await stationService.delete(station.id);
      setConfirmDialog({ isOpen: false, type: 'delete', station: null });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Station>[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'city', label: 'Ville', sortable: true },
    {
      key: 'stationCode',
      label: 'Code',
      render: (s) => (
        <span className="font-mono text-xs text-secondary-600">
          {(s as any).stationCode || '-'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      render: (s) => s.phone || '-',
    },
    {
      key: 'email',
      label: 'Email',
      render: (s) => s.email || '-',
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (s) => (
        <StatusBadge
          label={s.isActive ? 'Actif' : 'Inactif'}
          variant={s.isActive ? 'success' : 'danger'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Station>[] = [
    {
      icon: CheckCircleIcon,
      label: 'Activer',
      onClick: (s) => setConfirmDialog({ isOpen: true, type: 'toggle', station: s }),
      hidden: (s) => s.isActive,
    },
    {
      icon: NoSymbolIcon,
      label: 'Désactiver',
      onClick: (s) => setConfirmDialog({ isOpen: true, type: 'toggle', station: s }),
      hidden: (s) => !s.isActive,
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (s) => setConfirmDialog({ isOpen: true, type: 'delete', station: s }),
      variant: 'danger',
    },
  ];

  // KPI stats
  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.isActive).length;
  const inactiveStations = totalStations - activeStations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Gestion des stations</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Vue globale de toutes les stations enregistrées
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-500">Total</p>
          <p className="text-2xl font-bold text-secondary-900">{totalStations}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-green-600">Actives</p>
          <p className="text-2xl font-bold text-green-700">{activeStations}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-red-600">Inactives</p>
          <p className="text-2xl font-bold text-red-700">{inactiveStations}</p>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom ou ville..."
          />
        </div>
        <button
          onClick={loadData}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
        >
          Actualiser
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStations}
        loading={loading}
        actions={actions}
        keyExtractor={(s) => s.id}
        emptyTitle="Aucune station"
        emptyDescription="Aucune station ne correspond à votre recherche."
      />

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'toggle'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'toggle', station: null })}
        onConfirm={handleToggleActive}
        title={confirmDialog.station?.isActive ? 'Désactiver la station' : 'Activer la station'}
        message={`Voulez-vous ${confirmDialog.station?.isActive ? 'désactiver' : 'activer'} la station "${confirmDialog.station?.name}" ?`}
        confirmLabel={confirmDialog.station?.isActive ? 'Désactiver' : 'Activer'}
        variant={confirmDialog.station?.isActive ? 'warning' : 'info'}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'delete'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete', station: null })}
        onConfirm={handleDelete}
        title="Supprimer la station"
        message={`Voulez-vous vraiment supprimer la station "${confirmDialog.station?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
