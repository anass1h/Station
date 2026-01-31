import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supplierService, Supplier } from '@/services/supplierService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function SuppliersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; supplier: Supplier | null }>({
    isOpen: false,
    supplier: null,
  });

  const stationId = user?.stationId || '';

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', stationId],
    queryFn: () => supplierService.getByStation(stationId),
    enabled: !!stationId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteDialog({ isOpen: false, supplier: null });
    },
  });

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = search.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.contactName?.toLowerCase().includes(searchLower) ||
      supplier.phone?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower)
    );
  });

  const columns: Column<Supplier>[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'contactName', label: 'Contact', render: (s) => s.contactName || '-' },
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

  const actions: TableAction<Supplier>[] = [
    {
      icon: PencilIcon,
      label: 'Modifier',
      onClick: (supplier) => navigate(`/gestion/fournisseurs/${supplier.id}`),
    },
    {
      icon: TrashIcon,
      label: 'Supprimer',
      onClick: (supplier) => setDeleteDialog({ isOpen: true, supplier }),
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Fournisseurs</h1>
          <p className="text-secondary-500">Gerez vos fournisseurs de carburant</p>
        </div>
        <button
          onClick={() => navigate('/gestion/fournisseurs/nouveau')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un fournisseur..."
        className="max-w-md"
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSuppliers}
        loading={isLoading}
        keyExtractor={(s) => s.id}
        onRowClick={(supplier) => navigate(`/gestion/fournisseurs/${supplier.id}`)}
        actions={actions}
        emptyTitle="Aucun fournisseur"
        emptyDescription="Commencez par ajouter un fournisseur."
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, supplier: null })}
        onConfirm={() => deleteDialog.supplier && deleteMutation.mutate(deleteDialog.supplier.id)}
        title="Supprimer le fournisseur"
        message={`Voulez-vous vraiment supprimer le fournisseur "${deleteDialog.supplier?.name}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
