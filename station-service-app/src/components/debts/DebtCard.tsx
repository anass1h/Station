import { useNavigate } from 'react-router-dom';
import { PompisteDebt, debtService } from '@/services/debtService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/exportExcel';

interface DebtCardProps {
  debt: PompisteDebt;
  showPompiste?: boolean;
  onPayment?: () => void;
}

export function DebtCard({ debt, showPompiste = true, onPayment }: DebtCardProps) {
  const navigate = useNavigate();
  const statusConfig = debtService.getStatusConfig(debt.status);
  const paidAmount = debt.initialAmount - debt.remainingAmount;
  const progress = (paidAmount / debt.initialAmount) * 100;

  return (
    <div
      onClick={() => navigate(`/dettes/${debt.id}`)}
      className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          {showPompiste && debt.pompiste && (
            <p className="font-medium text-secondary-900">
              {debt.pompiste.firstName} {debt.pompiste.lastName}
            </p>
          )}
          <p className="text-sm text-secondary-500">
            {debtService.getReasonLabel(debt.reason)}
          </p>
        </div>
        <StatusBadge label={statusConfig.label} variant={statusConfig.variant} dot />
      </div>

      {debt.description && (
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{debt.description}</p>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-secondary-500">Progression</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
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

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-secondary-500">Initial</p>
          <p className="font-medium">{formatCurrency(debt.initialAmount)}</p>
        </div>
        <div>
          <p className="text-secondary-500">Payé</p>
          <p className="font-medium text-success-600">{formatCurrency(paidAmount)}</p>
        </div>
        <div>
          <p className="text-secondary-500">Reste</p>
          <p className={`font-medium ${debt.remainingAmount > 0 ? 'text-danger-600' : 'text-success-600'}`}>
            {formatCurrency(debt.remainingAmount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100">
        <p className="text-xs text-secondary-400">{formatDate(debt.createdAt)}</p>
        {(debt.status === 'PENDING' || debt.status === 'PARTIALLY_PAID') && onPayment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPayment();
            }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Ajouter paiement
          </button>
        )}
      </div>
    </div>
  );
}
