import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { DebtsByPompiste } from '@/services/debtService';
import { formatCurrency } from '@/utils/exportExcel';

interface DebtsByPompisteCardProps {
  data: DebtsByPompiste;
}

export function DebtsByPompisteCard({ data }: DebtsByPompisteCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-secondary-900">
            {data.pompiste.firstName} {data.pompiste.lastName}
          </p>
          {data.pompiste.badgeCode && (
            <p className="text-sm text-secondary-500 font-mono">{data.pompiste.badgeCode}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-danger-600">{formatCurrency(data.totalDebt)}</p>
          <p className="text-sm text-secondary-500">{data.debtsCount} dette{data.debtsCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-secondary-100">
        <div className="space-y-2">
          {data.debts.slice(0, 3).map((debt) => (
            <div
              key={debt.id}
              onClick={() => navigate(`/dettes/${debt.id}`)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    debt.status === 'PENDING'
                      ? 'bg-danger-500'
                      : debt.status === 'PARTIALLY_PAID'
                      ? 'bg-warning-500'
                      : 'bg-success-500'
                  }`}
                />
                <span className="text-sm text-secondary-600">
                  {debt.reason === 'CASH_VARIANCE' ? 'Écart caisse' :
                   debt.reason === 'SALARY_ADVANCE' ? 'Avance' :
                   debt.reason === 'DAMAGE' ? 'Dégât' :
                   debt.reason === 'FUEL_LOSS' ? 'Perte' : 'Autre'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatCurrency(debt.remainingAmount)}</span>
                <ChevronRightIcon className="h-4 w-4 text-secondary-400" />
              </div>
            </div>
          ))}
        </div>

        {data.debts.length > 3 && (
          <button
            onClick={() => navigate(`/dettes?pompisteId=${data.pompisteId}`)}
            className="w-full mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Voir toutes les dettes ({data.debts.length})
          </button>
        )}
      </div>
    </div>
  );
}
