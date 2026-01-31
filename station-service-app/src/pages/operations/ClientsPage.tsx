import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  DocumentPlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { clientService, Client, ClientType } from '@/services/clientService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/utils/exportExcel';

const typeLabels: Record<ClientType, string> = {
  B2B: 'Entreprise',
  B2C_REGISTERED: 'Particulier',
};

export function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '' as ClientType | '',
    isActive: '',
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', stationId, filters],
    queryFn: () => clientService.getAll(stationId, {
      type: filters.type || undefined,
      isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
    }),
    enabled: !!stationId,
  });

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    return (
      client.companyName?.toLowerCase().includes(searchLower) ||
      client.contactName.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  const getBalanceStatus = (client: Client) => {
    if (client.currentBalance === 0) return 'success';
    if (client.creditLimit === 0) return 'secondary';
    const ratio = client.currentBalance / client.creditLimit;
    if (ratio >= 1) return 'danger';
    if (ratio >= 0.8) return 'warning';
    return 'info';
  };

  const columns: Column<Client>[] = [
    {
      key: 'name',
      label: 'Nom / Raison sociale',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-medium text-secondary-900">{c.companyName || c.contactName}</p>
          {c.companyName && (
            <p className="text-sm text-secondary-500">{c.contactName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (c) => (
        <StatusBadge
          label={typeLabels[c.type]}
          variant={c.type === 'B2B' ? 'info' : 'secondary'}
        />
      ),
    },
    {
      key: 'phone',
      label: 'Telephone',
      render: (c) => c.phone || '-',
    },
    {
      key: 'creditLimit',
      label: 'Credit max',
      render: (c) => c.creditLimit > 0 ? formatCurrency(c.creditLimit) : '-',
    },
    {
      key: 'currentBalance',
      label: 'Solde',
      render: (c) => {
        if (c.currentBalance === 0) return '-';
        const status = getBalanceStatus(c);
        return (
          <span className={`font-medium ${
            status === 'danger' ? 'text-danger-600' :
            status === 'warning' ? 'text-warning-600' :
            'text-secondary-900'
          }`}>
            {formatCurrency(c.currentBalance)}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (c) => (
        <StatusBadge
          label={c.isActive ? 'Actif' : 'Inactif'}
          variant={c.isActive ? 'success' : 'secondary'}
          dot
        />
      ),
    },
  ];

  const actions: TableAction<Client>[] = [
    {
      icon: EyeIcon,
      label: 'Voir',
      onClick: (client) => navigate(`/operations/clients/${client.id}`),
    },
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (client) => navigate(`/operations/clients/${client.id}/modifier`),
    },
    {
      icon: DocumentPlusIcon,
      label: 'Nouvelle facture',
      onClick: (client) => navigate(`/operations/factures/nouveau?clientId=${client.id}`),
    },
  ];

  const typeOptions = [
    { value: 'B2B', label: 'Entreprise (B2B)' },
    { value: 'B2C_REGISTERED', label: 'Particulier' },
  ];

  const statusOptions = [
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clients</h1>
          <p className="text-secondary-500">Gestion des clients B2B et B2C</p>
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
            onClick={() => navigate('/operations/clients/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau client</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un client..."
        className="max-w-md"
      />

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Type"
              options={[{ value: '', label: 'Tous' }, ...typeOptions]}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v as ClientType | '' })}
            />
            <SelectField
              label="Statut"
              options={[{ value: '', label: 'Tous' }, ...statusOptions]}
              value={filters.isActive}
              onChange={(v) => setFilters({ ...filters, isActive: v })}
            />
          </div>
          <button
            onClick={() => setFilters({ type: '', isActive: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredClients}
        loading={isLoading}
        keyExtractor={(c) => c.id}
        onRowClick={(client) => navigate(`/operations/clients/${client.id}`)}
        actions={actions}
        emptyTitle="Aucun client"
        emptyDescription="Commencez par ajouter un client."
      />
    </div>
  );
}
