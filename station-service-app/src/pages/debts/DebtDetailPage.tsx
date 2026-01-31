import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
  BanknotesIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { debtService, DebtPayment } from '@/services/debtService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DebtPaymentModal } from '@/components/debts';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/exportExcel';

export function DebtDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: debt, isLoading } = useQuery({
    queryKey: ['debt', id],
    queryFn: () => debtService.getDebt(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => debtService.cancelDebt(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtsOverview'] });
      setShowCancelDialog(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Dette non trouvee</p>
      </div>
    );
  }

  const paidAmount = debt.initialAmount - debt.remainingAmount;
  const progress = (paidAmount / debt.initialAmount) * 100;
  const statusConfig = debtService.getStatusConfig(debt.status);

  const paymentColumns: Column<DebtPayment>[] = [
    {
      key: 'paymentDate',
      label: 'Date',
      render: (p) => formatDate(p.paymentDate),
    },
    {
      key: 'amount',
      label: 'Montant',
      render: (p) => <span className="font-medium text-success-600">{formatCurrency(p.amount)}</span>,
    },
    {
      key: 'paymentMethod',
      label: 'Mode',
      render: (p) => {
        const labels = {
          CASH: 'Especes',
          SALARY_DEDUCTION: 'Retenue salaire',
          OTHER: 'Autre',
        };
        return labels[p.paymentMethod];
      },
    },
    {
      key: 'note',
      label: 'Note',
      render: (p) => p.note || '-',
    },
    {
      key: 'receivedBy',
      label: 'Recu par',
      render: (p) => p.receivedBy ? `${p.receivedBy.firstName} ${p.receivedBy.lastName}` : '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dettes')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Dette - {debtService.getReasonLabel(debt.reason)}
            </h1>
            <StatusBadge label={statusConfig.label} variant={statusConfig.variant} dot />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {debt.status === 'PENDING' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              <span>Annuler</span>
            </button>
          )}
          {(debt.status === 'PENDING' || debt.status === 'PARTIALLY_PAID') && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter paiement</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pompiste Info */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Pompiste
          </h3>
          {debt.pompiste && (
            <Link
              to={`/gestion/pompistes/${debt.pompiste.id}`}
              className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">
                  {debt.pompiste.firstName} {debt.pompiste.lastName}
                </p>
                {debt.pompiste.badgeCode && (
                  <p className="text-sm text-secondary-500 font-mono">{debt.pompiste.badgeCode}</p>
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Debt Details */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5" />
            Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-600">Raison</span>
              <span className="font-medium">{debtService.getReasonLabel(debt.reason)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Date creation</span>
              <span className="font-medium">{formatDateTime(debt.createdAt)}</span>
            </div>
            {debt.createdBy && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Cree par</span>
                <span className="font-medium">{debt.createdBy.firstName} {debt.createdBy.lastName}</span>
              </div>
            )}
            {debt.description && (
              <div className="pt-3 border-t border-secondary-200">
                <p className="text-sm text-secondary-600">{debt.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cash Register Link */}
        {debt.cashRegister && (
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Cloture caisse liee
            </h3>
            <Link
              to={`/operations/shifts/${debt.cashRegister.shiftId}`}
              className="block p-3 bg-warning-50 rounded-lg hover:bg-warning-100 transition-colors"
            >
              <p className="text-sm text-warning-600">Écart de caisse</p>
              <p className="text-lg font-bold text-warning-700">
                {formatCurrency(Math.abs(debt.cashRegister.variance))}
              </p>
              <p className="text-xs text-warning-500 mt-1">Cliquez pour voir le shift</p>
            </Link>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Progression du remboursement</h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-secondary-600">
              {formatCurrency(paidAmount)} / {formatCurrency(debt.initialAmount)}
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-secondary-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                debt.status === 'PAID'
                  ? 'bg-success-500'
                  : debt.status === 'PARTIALLY_PAID'
                  ? 'bg-warning-500'
                  : 'bg-danger-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-500">Montant initial</p>
            <p className="text-xl font-bold text-secondary-900">{formatCurrency(debt.initialAmount)}</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <p className="text-sm text-success-600">Paye</p>
            <p className="text-xl font-bold text-success-700">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <p className="text-sm text-danger-600">Reste du</p>
            <p className="text-xl font-bold text-danger-700">{formatCurrency(debt.remainingAmount)}</p>
          </div>
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Historique des paiements</h3>
        <DataTable
          columns={paymentColumns}
          data={debt.payments || []}
          loading={false}
          keyExtractor={(p) => p.id}
          emptyTitle="Aucun paiement"
          emptyDescription="Aucun paiement enregistre pour cette dette."
        />
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Annuler la dette"
        message="Voulez-vous annuler cette dette ? Cette action est irreversible."
        confirmLabel="Annuler la dette"
        variant="danger"
        loading={cancelMutation.isPending}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <DebtPaymentModal
          debt={debt}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
