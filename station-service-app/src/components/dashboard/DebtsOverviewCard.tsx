import { useNavigate } from 'react-router-dom';
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface TopDebtor {
  pompiste: {
    id: string;
    firstName: string;
    lastName: string;
    badgeCode: string | null;
  } | null;
  totalDebt: number;
}

interface DebtsOverviewCardProps {
  totalActiveDebts: number;
  activeDebtsCount: number;
  pompistesWithDebtsCount: number;
  topDebtors: TopDebtor[];
  loading?: boolean;
}

export function DebtsOverviewCard({
  totalActiveDebts,
  activeDebtsCount,
  pompistesWithDebtsCount,
  topDebtors,
  loading = false,
}: DebtsOverviewCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-5 bg-secondary-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-4">
          <div className="h-12 bg-secondary-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-secondary-100 rounded animate-pulse" />
            <div className="h-16 bg-secondary-100 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-secondary-50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasDebts = totalActiveDebts > 0;

  return (
    <div className={`bg-white rounded-xl border-2 p-6 ${
      hasDebts ? 'border-danger-200' : 'border-secondary-200'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        {hasDebts ? (
          <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />
        ) : (
          <BanknotesIcon className="h-5 w-5 text-secondary-400" />
        )}
        <h3 className="text-lg font-semibold text-secondary-900">
          Dettes Pompistes
        </h3>
      </div>

      {!hasDebts ? (
        <div className="py-6 text-center">
          <BanknotesIcon className="h-12 w-12 text-success-300 mx-auto mb-2" />
          <p className="text-success-600 font-medium">Aucune dette en cours</p>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="bg-danger-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-danger-600 mb-1">Total des dettes</p>
            <p className="text-3xl font-bold text-danger-700">
              {totalActiveDebts.toLocaleString('fr-FR')} MAD
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-secondary-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-secondary-900">{activeDebtsCount}</p>
              <p className="text-xs text-secondary-500">Dettes actives</p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-secondary-900">{pompistesWithDebtsCount}</p>
              <p className="text-xs text-secondary-500">Pompistes endettes</p>
            </div>
          </div>

          {/* Top Debtors */}
          {topDebtors.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-secondary-600">Plus grosses dettes</p>
              {topDebtors.slice(0, 3).map((debtor, index) => {
                if (!debtor.pompiste) return null;
                return (
                  <div
                    key={debtor.pompiste.id}
                    className="flex items-center justify-between p-2 bg-secondary-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-danger-100 text-danger-700 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-secondary-700">
                        {debtor.pompiste.firstName} {debtor.pompiste.lastName}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-danger-600">
                      {debtor.totalDebt.toLocaleString('fr-FR')} MAD
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {hasDebts && (
        <button
          onClick={() => navigate('/pompiste-debts')}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Gerer les dettes
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
