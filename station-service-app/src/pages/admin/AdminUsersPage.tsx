import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService, type User, type UserRole } from '@/services/userService';
import { stationService, type Station } from '@/services/stationService';
import { DataTable, type Column, type TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  GESTIONNAIRE: 'Gestionnaire',
  POMPISTE: 'Pompiste',
};

const ROLE_VARIANTS: Record<UserRole, 'info' | 'warning' | 'secondary'> = {
  SUPER_ADMIN: 'info',
  GESTIONNAIRE: 'warning',
  POMPISTE: 'secondary',
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'toggle' | 'delete' | 'unlock';
    user: User | null;
  }>({ isOpen: false, type: 'toggle', user: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, stationsData] = await Promise.all([
        userService.getAll(),
        stationService.getAll(),
      ]);
      setUsers(usersData);
      setStations(stationsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (filterStation) {
      result = result.filter((u) => u.stationId === filterStation);
    }

    if (filterRole) {
      result = result.filter((u) => u.role === filterRole);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.badgeCode && u.badgeCode.toLowerCase().includes(q))
      );
    }

    return result;
  }, [users, search, filterStation, filterRole]);

  const handleToggleActive = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    setActionLoading(true);
    try {
      await userService.toggleActive(user.id, !user.isActive);
      setConfirmDialog({ isOpen: false, type: 'toggle', user: null });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    setActionLoading(true);
    try {
      await userService.delete(user.id);
      setConfirmDialog({ isOpen: false, type: 'delete', user: null });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    setActionLoading(true);
    try {
      await userService.unlockAccount(user.id);
      setConfirmDialog({ isOpen: false, type: 'unlock', user: null });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du déverrouillage');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (u) => (
        <div>
          <div className="font-medium text-secondary-900">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-xs text-secondary-500">{u.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (u) => (
        <StatusBadge
          label={ROLE_LABELS[u.role]}
          variant={ROLE_VARIANTS[u.role]}
        />
      ),
    },
    {
      key: 'station',
      label: 'Station',
      render: (u) => u.station?.name || '-',
    },
    {
      key: 'badgeCode',
      label: 'Badge',
      render: (u) =>
        u.badgeCode ? (
          <span className="font-mono text-xs bg-secondary-100 px-2 py-0.5 rounded">
            {u.badgeCode}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (u) => (
        <StatusBadge
          label={u.isActive ? 'Actif' : 'Inactif'}
          variant={u.isActive ? 'success' : 'danger'}
          dot
        />
      ),
    },
    {
      key: 'isLocked',
      label: 'Verrouillé',
      render: (u) => {
        const locked = (u as any).isLocked || (u as any).accountLockedUntil;
        return locked ? (
          <StatusBadge label="Verrouillé" variant="danger" />
        ) : (
          <span className="text-secondary-400 text-xs">Non</span>
        );
      },
    },
  ];

  const actions: TableAction<User>[] = [
    {
      icon: CheckCircleIcon,
      label: 'Activer',
      onClick: (u) => setConfirmDialog({ isOpen: true, type: 'toggle', user: u }),
      hidden: (u) => u.isActive,
    },
    {
      icon: NoSymbolIcon,
      label: 'Désactiver',
      onClick: (u) => setConfirmDialog({ isOpen: true, type: 'toggle', user: u }),
      hidden: (u) => !u.isActive,
    },
    {
      icon: LockOpenIcon,
      label: 'Déverrouiller',
      onClick: (u) => setConfirmDialog({ isOpen: true, type: 'unlock', user: u }),
      hidden: (u) => !((u as any).isLocked || (u as any).accountLockedUntil),
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (u) => setConfirmDialog({ isOpen: true, type: 'delete', user: u }),
      variant: 'danger',
    },
  ];

  // KPI stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const lockedUsers = users.filter((u) => (u as any).isLocked || (u as any).accountLockedUntil).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Gestion des utilisateurs</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Vue globale de tous les utilisateurs de toutes les stations
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
          <p className="text-2xl font-bold text-secondary-900">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-green-600">Actifs</p>
          <p className="text-2xl font-bold text-green-700">{activeUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-red-600">Verrouillés</p>
          <p className="text-2xl font-bold text-red-700">{lockedUsers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom, email ou badge..."
          />
        </div>
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Toutes les stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tous les rôles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="GESTIONNAIRE">Gestionnaire</option>
          <option value="POMPISTE">Pompiste</option>
        </select>
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
        data={filteredUsers}
        loading={loading}
        actions={actions}
        keyExtractor={(u) => u.id}
        emptyTitle="Aucun utilisateur"
        emptyDescription="Aucun utilisateur ne correspond à vos critères."
      />

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'toggle'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'toggle', user: null })}
        onConfirm={handleToggleActive}
        title={confirmDialog.user?.isActive ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
        message={`Voulez-vous ${confirmDialog.user?.isActive ? 'désactiver' : 'activer'} l'utilisateur "${confirmDialog.user?.firstName} ${confirmDialog.user?.lastName}" ?`}
        confirmLabel={confirmDialog.user?.isActive ? 'Désactiver' : 'Activer'}
        variant={confirmDialog.user?.isActive ? 'warning' : 'info'}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'delete'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete', user: null })}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Voulez-vous vraiment supprimer l'utilisateur "${confirmDialog.user?.firstName} ${confirmDialog.user?.lastName}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'unlock'}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'unlock', user: null })}
        onConfirm={handleUnlock}
        title="Déverrouiller le compte"
        message={`Voulez-vous déverrouiller le compte de "${confirmDialog.user?.firstName} ${confirmDialog.user?.lastName}" ?`}
        confirmLabel="Déverrouiller"
        variant="info"
        loading={actionLoading}
      />
    </div>
  );
}
