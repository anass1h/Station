import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { invoiceService, Invoice, InvoiceStatus, InvoiceType } from '@/services/invoiceService';
import { clientService } from '@/services/clientService';
import { useAuthStore } from '@/stores/authStore';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { exportToExcel, formatDate, formatCurrency } from '@/utils/exportExcel';

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'secondary' | 'info' | 'warning' | 'success' | 'danger' }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  ISSUED: { label: 'Emise', variant: 'info' },
  PARTIALLY_PAID: { label: 'Partiel', variant: 'warning' },
  PAID: { label: 'Payee', variant: 'success' },
  CANCELLED: { label: 'Annulee', variant: 'danger' },
};

const typeLabels: Record<InvoiceType, string> = {
  INTERNAL: 'Interne',
  B2B: 'B2B',
  B2C_TICKET: 'Ticket',
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as InvoiceStatus | '',
    clientId: '',
    type: '' as InvoiceType | '',
    startDate: '',
    endDate: '',
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', stationId, filters],
    queryFn: () => invoiceService.getAll(stationId, {
      status: filters.status || undefined,
      clientId: filters.clientId || undefined,
      type: filters.type || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    enabled: !!stationId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', stationId],
    queryFn: () => clientService.getAll(stationId),
    enabled: !!stationId,
  });

  const handleExport = () => {
    exportToExcel(invoices, 'factures', [
      { key: 'invoiceNumber', label: 'N° Facture' },
      { key: 'issuedAt', label: 'Date', format: (v) => v ? formatDate(v as string) : '-' },
      { key: 'client', label: 'Client', format: (_, item) => (item as Invoice).client?.companyName || (item as Invoice).client?.contactName || 'N/A' },
      { key: 'type', label: 'Type', format: (v) => typeLabels[v as InvoiceType] },
      { key: 'totalHT', label: 'HT', format: (v) => formatCurrency(v as number) },
      { key: 'tvaAmount', label: 'TVA', format: (v) => formatCurrency(v as number) },
      { key: 'totalTTC', label: 'TTC', format: (v) => formatCurrency(v as number) },
      { key: 'paidAmount', label: 'Paye', format: (v) => formatCurrency(v as number) },
      { key: 'status', label: 'Statut', format: (v) => statusConfig[v as InvoiceStatus].label },
    ]);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const blob = await invoiceService.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'N° Facture',
      render: (i) => <span className="font-mono font-medium">{i.invoiceNumber}</span>,
    },
    {
      key: 'issuedAt',
      label: 'Date',
      sortable: true,
      render: (i) => i.issuedAt ? formatDate(i.issuedAt) : '-',
    },
    {
      key: 'client',
      label: 'Client',
      render: (i) => i.client?.companyName || i.client?.contactName || 'N/A',
    },
    {
      key: 'type',
      label: 'Type',
      render: (i) => (
        <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs">
          {typeLabels[i.type]}
        </span>
      ),
    },
    {
      key: 'totalHT',
      label: 'HT',
      render: (i) => formatCurrency(i.totalHT),
    },
    {
      key: 'tvaAmount',
      label: 'TVA',
      render: (i) => formatCurrency(i.tvaAmount),
    },
    {
      key: 'totalTTC',
      label: 'TTC',
      render: (i) => <span className="font-medium">{formatCurrency(i.totalTTC)}</span>,
    },
    {
      key: 'paidAmount',
      label: 'Paye',
      render: (i) => (
        <span className={i.paidAmount >= i.totalTTC ? 'text-success-600' : 'text-secondary-600'}>
          {formatCurrency(i.paidAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (i) => {
        const config = statusConfig[i.status];
        return <StatusBadge label={config.label} variant={config.variant} dot />;
      },
    },
  ];

  const actions: TableAction<Invoice>[] = [
    {
      icon: EyeIcon,
      label: 'Voir',
      onClick: (invoice) => navigate(`/operations/factures/${invoice.id}`),
    },
    {
      icon: DocumentArrowDownIcon,
      label: 'PDF',
      onClick: handleDownloadPdf,
      hidden: (invoice) => invoice.status === 'DRAFT',
    },
    {
      icon: BanknotesIcon,
      label: 'Paiement',
      onClick: (invoice) => navigate(`/operations/factures/${invoice.id}?action=payment`),
      hidden: (invoice) => invoice.status !== 'ISSUED' && invoice.status !== 'PARTIALLY_PAID',
    },
  ];

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.companyName || c.contactName,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Factures</h1>
          <p className="text-secondary-500">Gestion des factures</p>
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
            onClick={handleExport}
            disabled={invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 bg-white text-secondary-700 rounded-lg hover:bg-secondary-50 disabled:opacity-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/operations/factures/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvelle facture</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <SelectField
              label="Statut"
              options={[{ value: '', label: 'Tous' }, ...statusOptions]}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v as InvoiceStatus | '' })}
            />
            <SelectField
              label="Client"
              options={[{ value: '', label: 'Tous' }, ...clientOptions]}
              value={filters.clientId}
              onChange={(v) => setFilters({ ...filters, clientId: v })}
              searchable
            />
            <SelectField
              label="Type"
              options={[{ value: '', label: 'Tous' }, ...typeOptions]}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v as InvoiceType | '' })}
            />
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
          </div>
          <button
            onClick={() => setFilters({ status: '', clientId: '', type: '', startDate: '', endDate: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Reinitialiser les filtres
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={isLoading}
        keyExtractor={(i) => i.id}
        onRowClick={(invoice) => navigate(`/operations/factures/${invoice.id}`)}
        actions={actions}
        emptyTitle="Aucune facture"
        emptyDescription="Aucune facture trouvee avec les filtres selectionnes."
      />
    </div>
  );
}
