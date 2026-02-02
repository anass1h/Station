import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  ClockIcon,
  UserIcon,
  BeakerIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { shiftOperationsService } from '@/services/shiftOperationsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDateTime, formatCurrency, formatNumber } from '@/utils/exportExcel';
import { useState } from 'react';

interface ShiftSale {
  id: string;
  quantity: number;
  totalAmount: number;
  saleTime: string;
  paymentMethod: string;
  client?: {
    id: string;
    companyName: string | null;
    contactName: string;
  };
}

const statusConfig = {
  OPEN: { label: 'En cours', variant: 'info' as const },
  CLOSED: { label: 'Cloture', variant: 'warning' as const },
  VALIDATED: { label: 'Valide', variant: 'success' as const },
};

export function ShiftDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showValidateDialog, setShowValidateDialog] = useState(false);

  const { data: shift, isLoading } = useQuery({
    queryKey: ['shift', id],
    queryFn: () => shiftOperationsService.getShiftById(id!),
    enabled: !!id,
  });

  const validateMutation = useMutation({
    mutationFn: () => shiftOperationsService.validateShift(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift', id] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowValidateDialog(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Shift non trouve</p>
      </div>
    );
  }

  const duration = shift.endTime
    ? Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 60000)
    : Math.round((Date.now() - new Date(shift.startTime).getTime()) / 60000);

  const durationHours = Math.floor(duration / 60);
  const durationMinutes = duration % 60;

  const salesColumns: Column<ShiftSale>[] = [
    {
      key: 'saleTime',
      label: 'Heure',
      render: (s) => new Date(s.saleTime).toLocaleTimeString('fr-FR'),
    },
    {
      key: 'quantity',
      label: 'Litres',
      render: (s) => `${formatNumber(Number(s.quantity))} L`,
    },
    {
      key: 'totalAmount',
      label: 'Montant',
      render: (s) => formatCurrency(Number(s.totalAmount)),
    },
    {
      key: 'paymentMethod',
      label: 'Paiement',
      render: (s) => s.paymentMethod,
    },
    {
      key: 'client',
      label: 'Client',
      render: (s) => s.client?.companyName || s.client?.contactName || '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/operations/shifts')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Detail du shift</h1>
            <p className="text-secondary-500">
              {formatDateTime(shift.startTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            label={statusConfig[shift.status].label}
            variant={statusConfig[shift.status].variant}
            dot
          />
          {shift.status === 'CLOSED' && (
            <button
              onClick={() => setShowValidateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
            >
              <CheckBadgeIcon className="h-5 w-5" />
              <span>Valider le shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pompiste</p>
              <p className="font-semibold text-secondary-900">
                {shift.pompiste.firstName} {shift.pompiste.lastName}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BeakerIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pistolet / Carburant</p>
              <p className="font-semibold text-secondary-900">
                {shift.nozzle.reference} - {shift.nozzle.tank?.fuelType?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Duree</p>
              <p className="font-semibold text-secondary-900">
                {durationHours}h {durationMinutes}min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Chiffre d'affaires</p>
              <p className="font-semibold text-success-600">
                {formatCurrency(Number(shift.totalAmount))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Index & Litres */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Index et volumes</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-1">Index debut</p>
            <p className="text-2xl font-bold text-secondary-900">{formatNumber(Number(shift.startIndex))} L</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-1">Index fin</p>
            <p className="text-2xl font-bold text-secondary-900">
              {shift.endIndex ? `${formatNumber(Number(shift.endIndex))} L` : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-1">Litres vendus</p>
            <p className="text-2xl font-bold text-primary-600">{formatNumber(Number(shift.totalLiters))} L</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-1">Nombre de ventes</p>
            <p className="text-2xl font-bold text-secondary-900">{shift.salesCount}</p>
          </div>
        </div>
      </div>

      {/* Cash Register Info */}
      {shift.cashRegister && (
        <div className={`rounded-xl border-2 p-6 ${
          shift.cashRegister.variance === 0
            ? 'bg-success-50 border-success-200'
            : Math.abs(shift.cashRegister.variance) < 50
              ? 'bg-warning-50 border-warning-200'
              : 'bg-danger-50 border-danger-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {shift.cashRegister.variance !== 0 && (
              <ExclamationTriangleIcon className={`h-5 w-5 ${
                Math.abs(shift.cashRegister.variance) < 50 ? 'text-warning-600' : 'text-danger-600'
              }`} />
            )}
            <h2 className="text-lg font-semibold text-secondary-900">Cloture de caisse</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-secondary-600 mb-1">Montant attendu</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(Number(shift.cashRegister.expectedAmount))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary-600 mb-1">Montant declare</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(Number(shift.cashRegister.declaredAmount))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary-600 mb-1">Ecart</p>
              <p className={`text-2xl font-bold ${
                Number(shift.cashRegister.variance) === 0
                  ? 'text-success-600'
                  : Number(shift.cashRegister.variance) > 0
                    ? 'text-success-600'
                    : 'text-danger-600'
              }`}>
                {Number(shift.cashRegister.variance) > 0 ? '+' : ''}{formatCurrency(Number(shift.cashRegister.variance))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Ventes du shift ({shift.sales?.length || 0})
        </h2>
        <DataTable
          columns={salesColumns}
          data={shift.sales || []}
          loading={false}
          keyExtractor={(s) => s.id}
          emptyTitle="Aucune vente"
          emptyDescription="Aucune vente enregistree pour ce shift."
        />
      </div>

      {/* Validation Info */}
      {shift.validatedAt && shift.validatedBy && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4">
          <p className="text-sm text-success-700">
            Shift valide le {formatDateTime(shift.validatedAt)} par{' '}
            <strong>{shift.validatedBy.firstName} {shift.validatedBy.lastName}</strong>
          </p>
        </div>
      )}

      {/* Validate Dialog */}
      <ConfirmDialog
        isOpen={showValidateDialog}
        onClose={() => setShowValidateDialog(false)}
        onConfirm={() => validateMutation.mutate()}
        title="Valider le shift"
        message="Confirmer la validation de ce shift ? Cette action est irreversible."
        confirmLabel="Valider"
        variant="info"
        loading={validateMutation.isPending}
      />
    </div>
  );
}
