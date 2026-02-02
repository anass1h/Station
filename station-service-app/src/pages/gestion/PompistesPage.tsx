import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  KeyIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { userService, User } from '@/services/userService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function PompistesPage() {
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    pompiste: User | null;
    action: 'activate' | 'deactivate' | 'resetPin';
  }>({ isOpen: false, pompiste: null, action: 'deactivate' });
  const [newPin, setNewPin] = useState('');

  const { data: pompistes = [], isLoading } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pompistes'] });
      setConfirmDialog({ isOpen: false, pompiste: null, action: 'deactivate' });
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      userService.resetPin(id, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pompistes'] });
      setConfirmDialog({ isOpen: false, pompiste: null, action: 'resetPin' });
      setNewPin('');
    },
  });

  const filteredPompistes = pompistes.filter((pompiste) => {
    const searchLower = search.toLowerCase();
    return (
      pompiste.firstName.toLowerCase().includes(searchLower) ||
      pompiste.lastName.toLowerCase().includes(searchLower) ||
      pompiste.badgeCode?.toLowerCase().includes(searchLower) ||
      pompiste.phone?.toLowerCase().includes(searchLower)
    );
  });

  const columns: Column<User>[] = [
    {
      key: 'badgeCode',
      label: 'Badge',
      render: (p) => (
        <span className="font-mono bg-secondary-100 px-2 py-1 rounded text-sm">
          {p.badgeCode || '-'}
        </span>
      ),
    },
    { key: 'lastName', label: 'Nom', sortable: true },
    { key: 'firstName', label: 'Prenom', sortable: true },
    { key: 'phone', label: 'Telephone', render: (p) => p.phone || '-' },
    {
      key: 'isActive',
      label: 'Statut',
      render: (p) => (
        <StatusBadge
          label={p.isActive ? 'Actif' : 'Inactif'}
          variant={p.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
    {
      key: 'totalDebt',
      label: 'Dette',
      render: (p) => {
        const debt = p.totalDebt || 0;
        if (debt === 0) return <span className="text-secondary-500">-</span>;
        return (
          <StatusBadge
            label={`${debt.toLocaleString('fr-FR')} MAD`}
            variant="danger"
          />
        );
      },
    },
  ];

  const actions: TableAction<User>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (pompiste) => navigate(`/gestion/pompistes/${pompiste.id}`),
    },
    {
      icon: KeyIcon,
      label: 'Reinitialiser PIN',
      onClick: (pompiste) =>
        setConfirmDialog({ isOpen: true, pompiste, action: 'resetPin' }),
    },
    {
      icon: NoSymbolIcon,
      label: 'Desactiver',
      onClick: (pompiste) =>
        setConfirmDialog({ isOpen: true, pompiste, action: 'deactivate' }),
      variant: 'danger',
      hidden: (pompiste) => !pompiste.isActive,
    },
    {
      icon: CheckCircleIcon,
      label: 'Activer',
      onClick: (pompiste) =>
        setConfirmDialog({ isOpen: true, pompiste, action: 'activate' }),
      hidden: (pompiste) => pompiste.isActive,
    },
  ];

  const handleConfirm = () => {
    if (!confirmDialog.pompiste) return;

    if (confirmDialog.action === 'resetPin') {
      if (newPin.length !== 6) return;
      resetPinMutation.mutate({ id: confirmDialog.pompiste.id, pin: newPin });
    } else {
      toggleMutation.mutate({
        id: confirmDialog.pompiste.id,
        isActive: confirmDialog.action === 'activate',
      });
    }
  };

  const getDialogContent = () => {
    if (confirmDialog.action === 'resetPin') {
      return {
        title: 'Reinitialiser le PIN',
        message: `Entrez le nouveau PIN a 6 chiffres pour ${confirmDialog.pompiste?.firstName} ${confirmDialog.pompiste?.lastName}`,
        confirmLabel: 'Reinitialiser',
        variant: 'warning' as const,
      };
    }
    if (confirmDialog.action === 'activate') {
      return {
        title: 'Activer le pompiste',
        message: `Voulez-vous activer ${confirmDialog.pompiste?.firstName} ${confirmDialog.pompiste?.lastName} ?`,
        confirmLabel: 'Activer',
        variant: 'info' as const,
      };
    }
    return {
      title: 'Desactiver le pompiste',
      message: `Voulez-vous desactiver ${confirmDialog.pompiste?.firstName} ${confirmDialog.pompiste?.lastName} ? Il ne pourra plus se connecter.`,
      confirmLabel: 'Desactiver',
      variant: 'danger' as const,
    };
  };

  const dialogContent = getDialogContent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Pompistes</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Gerez les pompistes de votre station'}
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
            onClick={() => navigate('/gestion/pompistes/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau pompiste</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un pompiste..."
        className="max-w-md"
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPompistes}
        loading={isLoading}
        keyExtractor={(p) => p.id}
        onRowClick={(pompiste) => navigate(`/gestion/pompistes/${pompiste.id}`)}
        actions={actions}
        emptyTitle="Aucun pompiste"
        emptyDescription="Commencez par ajouter un pompiste."
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false, pompiste: null, action: 'deactivate' });
          setNewPin('');
        }}
        onConfirm={handleConfirm}
        title={dialogContent.title}
        message={dialogContent.message}
        confirmLabel={dialogContent.confirmLabel}
        variant={dialogContent.variant}
        loading={toggleMutation.isPending || resetPinMutation.isPending}
      />

      {/* PIN Input Modal */}
      {confirmDialog.isOpen && confirmDialog.action === 'resetPin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDialog({ isOpen: false, pompiste: null, action: 'deactivate' })} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Nouveau PIN pour {confirmDialog.pompiste?.firstName}
            </h3>
            <input
              type="text"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-sm text-secondary-500 mt-2 text-center">
              Entrez 6 chiffres
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setConfirmDialog({ isOpen: false, pompiste: null, action: 'deactivate' });
                  setNewPin('');
                }}
                className="flex-1 px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={newPin.length !== 6 || resetPinMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {resetPinMutation.isPending ? 'Chargement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
