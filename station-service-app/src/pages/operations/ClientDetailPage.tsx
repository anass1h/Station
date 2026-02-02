import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentPlusIcon,
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { clientService } from '@/services/clientService';
import { invoiceService } from '@/services/invoiceService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/exportExcel';

type TabType = 'purchases' | 'invoices' | 'payments';

export function ClientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('purchases');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['clientPurchases', id],
    queryFn: () => clientService.getPurchaseHistory(id!),
    enabled: !!id && activeTab === 'purchases',
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['clientInvoices', id],
    queryFn: () => invoiceService.getAll('', { clientId: id }),
    enabled: !!id && activeTab === 'invoices',
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['clientPayments', id],
    queryFn: () => clientService.getPaymentHistory(id!),
    enabled: !!id && activeTab === 'payments',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Client non trouve</p>
      </div>
    );
  }

  const creditUsagePercent = Number(client.creditLimit) > 0
    ? (Number(client.currentBalance) / Number(client.creditLimit)) * 100
    : 0;

  const getCreditColor = () => {
    if (creditUsagePercent >= 100) return 'danger';
    if (creditUsagePercent >= 80) return 'warning';
    return 'success';
  };

  const colorClasses = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  const tabs = [
    { id: 'purchases' as TabType, label: 'Achats' },
    { id: 'invoices' as TabType, label: 'Factures' },
    { id: 'payments' as TabType, label: 'Paiements' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/operations/clients')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {client.companyName || client.contactName}
            </h1>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={client.type === 'B2B' ? 'Entreprise' : 'Particulier'}
                variant={client.type === 'B2B' ? 'info' : 'secondary'}
              />
              <StatusBadge
                label={client.isActive ? 'Actif' : 'Inactif'}
                variant={client.isActive ? 'success' : 'secondary'}
                dot
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/operations/clients/${id}/modifier`)}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => navigate(`/operations/factures/nouveau?clientId=${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <DocumentPlusIcon className="h-5 w-5" />
            <span>Nouvelle facture</span>
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Informations</h3>
          <div className="space-y-3">
            {client.companyName && (
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-700">{client.companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-secondary-400" />
              <span className="text-secondary-700">{client.contactName}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-700">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-700">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-700">{client.address}</span>
              </div>
            )}
          </div>

          {client.type === 'B2B' && (client.ice || client.iff || client.rc) && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <h4 className="text-sm font-medium text-secondary-600 mb-2">Info fiscales</h4>
              <div className="space-y-1 text-sm">
                {client.ice && <p><span className="text-secondary-500">ICE:</span> {client.ice}</p>}
                {client.iff && <p><span className="text-secondary-500">IF:</span> {client.iff}</p>}
                {client.rc && <p><span className="text-secondary-500">RC:</span> {client.rc}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Credit Info */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Credit</h3>

          {client.creditLimit > 0 ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">Utilisation</span>
                  <span className="font-medium">{creditUsagePercent.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-secondary-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colorClasses[getCreditColor()]}`}
                    style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary-50 rounded-lg">
                  <p className="text-sm text-secondary-500">Solde actuel</p>
                  <p className={`text-xl font-bold ${
                    Number(client.currentBalance) > 0 ? 'text-danger-600' : 'text-success-600'
                  }`}>
                    {formatCurrency(Number(client.currentBalance))}
                  </p>
                </div>
                <div className="text-center p-3 bg-secondary-50 rounded-lg">
                  <p className="text-sm text-secondary-500">Plafond</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {formatCurrency(Number(client.creditLimit))}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-secondary-500">Pas de credit autorise</p>
          )}

          <div className="mt-4 pt-4 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">
              Delai de paiement: <strong>{client.paymentTermDays} jours</strong>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Statistiques</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Total achats</span>
              <span className="font-semibold">{formatCurrency(Number(client.totalPurchases || 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Total facture</span>
              <span className="font-semibold">{formatCurrency(Number(client.totalInvoiced || 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Total paye</span>
              <span className="font-semibold text-success-600">{formatCurrency(Number(client.totalPaid || 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-secondary-200">
        <div className="border-b border-secondary-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'purchases' && (
            <DataTable
              columns={[
                { key: 'saleTime', label: 'Date', render: (p: any) => formatDateTime(p.saleTime) },
                { key: 'fuelType', label: 'Carburant', render: (p: any) => p.fuelType?.name || '-' },
                { key: 'quantity', label: 'Litres', render: (p: any) => `${Number(p.quantity)} L` },
                { key: 'totalAmount', label: 'Montant', render: (p: any) => formatCurrency(Number(p.totalAmount)) },
              ]}
              data={purchases as any[]}
              loading={false}
              keyExtractor={(p: any) => p.id}
              emptyTitle="Aucun achat"
              emptyDescription="Aucun achat enregistre pour ce client."
            />
          )}

          {activeTab === 'invoices' && (
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'N° Facture' },
                { key: 'issuedAt', label: 'Date', render: (i: any) => i.issuedAt ? formatDate(i.issuedAt) : '-' },
                { key: 'totalTTC', label: 'Montant TTC', render: (i: any) => formatCurrency(Number(i.totalTTC)) },
                { key: 'paidAmount', label: 'Paye', render: (i: any) => formatCurrency(Number(i.paidAmount)) },
                { key: 'status', label: 'Statut', render: (i: any) => <StatusBadge label={i.status} variant="info" /> },
              ]}
              data={invoices as any[]}
              loading={false}
              keyExtractor={(i: any) => i.id}
              onRowClick={(invoice: any) => navigate(`/operations/factures/${invoice.id}`)}
              emptyTitle="Aucune facture"
              emptyDescription="Aucune facture pour ce client."
            />
          )}

          {activeTab === 'payments' && (
            <DataTable
              columns={[
                { key: 'paymentDate', label: 'Date', render: (p: any) => formatDate(p.paymentDate) },
                { key: 'invoiceNumber', label: 'Facture', render: (p: any) => p.invoice?.invoiceNumber || '-' },
                { key: 'amount', label: 'Montant', render: (p: any) => formatCurrency(Number(p.amount)) },
                { key: 'paymentMethod', label: 'Moyen', render: (p: any) => p.paymentMethod?.name || '-' },
              ]}
              data={payments as any[]}
              loading={false}
              keyExtractor={(p: any) => p.id}
              emptyTitle="Aucun paiement"
              emptyDescription="Aucun paiement enregistre."
            />
          )}
        </div>
      </div>
    </div>
  );
}
