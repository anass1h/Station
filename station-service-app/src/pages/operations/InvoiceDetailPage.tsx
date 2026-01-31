import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { invoiceService, InvoiceStatus, InvoiceLine, InvoicePayment } from '@/services/invoiceService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AddPaymentModal } from '@/components/operations/AddPaymentModal';
import { formatCurrency, formatDate } from '@/utils/exportExcel';

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'secondary' | 'info' | 'warning' | 'success' | 'danger' }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  ISSUED: { label: 'Emise', variant: 'info' },
  PARTIALLY_PAID: { label: 'Partiellement payee', variant: 'warning' },
  PAID: { label: 'Payee', variant: 'success' },
  CANCELLED: { label: 'Annulee', variant: 'danger' },
};

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id!),
    enabled: !!id,
  });

  // Open payment modal if action=payment in URL
  useEffect(() => {
    if (searchParams.get('action') === 'payment' && invoice) {
      setShowPaymentModal(true);
    }
  }, [searchParams, invoice]);

  const issueMutation = useMutation({
    mutationFn: () => invoiceService.issue(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowIssueDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoiceService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/operations/factures');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoiceService.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCancelDialog(false);
    },
  });

  const handleDownloadPdf = async () => {
    if (!invoice) return;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Facture non trouvee</p>
      </div>
    );
  }

  const remainingAmount = invoice.totalTTC - invoice.paidAmount;
  const config = statusConfig[invoice.status];

  const lineColumns: Column<InvoiceLine>[] = [
    {
      key: 'fuelType',
      label: 'Carburant',
      render: (l) => l.fuelType?.name || '-',
    },
    {
      key: 'description',
      label: 'Description',
    },
    {
      key: 'quantity',
      label: 'Quantite',
      render: (l) => l.quantity.toFixed(2),
    },
    {
      key: 'unitPriceHT',
      label: 'PU HT',
      render: (l) => formatCurrency(l.unitPriceHT),
    },
    {
      key: 'totalHT',
      label: 'Total HT',
      render: (l) => formatCurrency(l.totalHT),
    },
  ];

  const paymentColumns: Column<InvoicePayment>[] = [
    {
      key: 'paymentDate',
      label: 'Date',
      render: (p) => formatDate(p.paymentDate),
    },
    {
      key: 'paymentMethod',
      label: 'Moyen',
      render: (p) => p.paymentMethod?.name || '-',
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (p) => p.reference || '-',
    },
    {
      key: 'amount',
      label: 'Montant',
      render: (p) => <span className="font-medium text-success-600">{formatCurrency(p.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/operations/factures')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 font-mono">{invoice.invoiceNumber}</h1>
            <StatusBadge label={config.label} variant={config.variant} dot />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <>
              <button
                onClick={() => navigate(`/operations/factures/${id}/modifier`)}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
                <span>Supprimer</span>
              </button>
              <button
                onClick={() => setShowIssueDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Emettre</span>
              </button>
            </>
          )}

          {(invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID') && (
            <>
              <button
                onClick={() => setShowCancelDialog(true)}
                className="flex items-center gap-2 px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
              >
                <BanknotesIcon className="h-5 w-5" />
                <span>Ajouter paiement</span>
              </button>
            </>
          )}

          {invoice.status === 'PAID' && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Telecharger PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Informations</h3>
          <div className="space-y-3">
            {invoice.client && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Client</span>
                <Link
                  to={`/operations/clients/${invoice.client.id}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {invoice.client.companyName || invoice.client.contactName}
                </Link>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary-600">Type</span>
              <span className="font-medium">{invoice.type}</span>
            </div>
            {invoice.issuedAt && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Date emission</span>
                <span className="font-medium">{formatDate(invoice.issuedAt)}</span>
              </div>
            )}
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Echeance</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.periodStart && invoice.periodEnd && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Periode</span>
                <span className="font-medium">
                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Totaux</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Total HT</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.totalHT)}</p>
            </div>
            <div className="text-center p-3 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">TVA</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.tvaAmount)}</p>
            </div>
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600">Total TTC</p>
              <p className="text-xl font-bold text-primary-700">{formatCurrency(invoice.totalTTC)}</p>
            </div>
            <div className="text-center p-3 bg-success-50 rounded-lg">
              <p className="text-sm text-success-600">Paye</p>
              <p className="text-xl font-bold text-success-700">{formatCurrency(invoice.paidAmount)}</p>
            </div>
            <div className="text-center p-3 bg-warning-50 rounded-lg">
              <p className="text-sm text-warning-600">Reste</p>
              <p className="text-xl font-bold text-warning-700">{formatCurrency(remainingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Lignes de facture</h3>
        <DataTable
          columns={lineColumns}
          data={invoice.lines || []}
          loading={false}
          keyExtractor={(l) => l.id}
          emptyTitle="Aucune ligne"
          emptyDescription="Cette facture ne contient aucune ligne."
        />
      </div>

      {/* Payments */}
      {(invoice.payments?.length || 0) > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Paiements recus</h3>
          <DataTable
            columns={paymentColumns}
            data={invoice.payments || []}
            loading={false}
            keyExtractor={(p) => p.id}
            emptyTitle="Aucun paiement"
            emptyDescription="Aucun paiement enregistre."
          />
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-2">Notes</h3>
          <p className="text-secondary-600">{invoice.notes}</p>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={showIssueDialog}
        onClose={() => setShowIssueDialog(false)}
        onConfirm={() => issueMutation.mutate()}
        title="Emettre la facture"
        message="Voulez-vous emettre cette facture ? Elle ne pourra plus etre modifiee."
        confirmLabel="Emettre"
        variant="info"
        loading={issueMutation.isPending}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer la facture"
        message="Voulez-vous supprimer cette facture brouillon ? Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Annuler la facture"
        message="Voulez-vous annuler cette facture ? Un avoir sera genere automatiquement."
        confirmLabel="Annuler la facture"
        variant="danger"
        loading={cancelMutation.isPending}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <AddPaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
