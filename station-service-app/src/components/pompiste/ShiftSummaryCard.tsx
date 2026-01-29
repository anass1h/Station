import { ClockIcon, BeakerIcon, BanknotesIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface ShiftSummaryCardProps {
  nozzleReference: string;
  fuelTypeName: string;
  indexStart: number;
  currentIndex: number;
  salesCount: number;
  totalAmount: number;
  startedAt: string;
  compact?: boolean;
}

export function ShiftSummaryCard({
  nozzleReference,
  fuelTypeName,
  indexStart,
  currentIndex,
  salesCount,
  totalAmount,
  startedAt,
  compact = false,
}: ShiftSummaryCardProps) {
  const litersTotal = currentIndex - indexStart;

  // Format time
  const formatStartTime = () => {
    const date = new Date(startedAt);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-secondary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <BeakerIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-secondary-900">{nozzleReference}</p>
              <p className="text-sm text-secondary-500">{fuelTypeName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary-600">
              {totalAmount.toLocaleString('fr-FR')} MAD
            </p>
            <p className="text-sm text-secondary-500">{salesCount} ventes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold">{nozzleReference}</p>
            <p className="text-primary-200">{fuelTypeName}</p>
          </div>
          <div className="flex items-center gap-2 bg-primary-700/50 px-3 py-1.5 rounded-lg">
            <ClockIcon className="h-5 w-5" />
            <span className="font-medium">Debut : {formatStartTime()}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-secondary-200">
        {/* Index start */}
        <div className="bg-white p-4">
          <p className="text-sm text-secondary-500 mb-1">Index debut</p>
          <p className="text-2xl font-bold font-mono text-secondary-900">
            {indexStart.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-secondary-400">litres</p>
        </div>

        {/* Current index */}
        <div className="bg-white p-4">
          <p className="text-sm text-secondary-500 mb-1">Index actuel</p>
          <p className="text-2xl font-bold font-mono text-secondary-900">
            {currentIndex.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-secondary-400">litres</p>
        </div>

        {/* Liters sold */}
        <div className="bg-success-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BeakerIcon className="h-4 w-4 text-success-600" />
            <p className="text-sm text-success-700">Litres vendus</p>
          </div>
          <p className="text-2xl font-bold font-mono text-success-700">
            {litersTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Sales count */}
        <div className="bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCartIcon className="h-4 w-4 text-secondary-600" />
            <p className="text-sm text-secondary-500">Nombre de ventes</p>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{salesCount}</p>
        </div>
      </div>

      {/* Total amount */}
      <div className="bg-primary-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BanknotesIcon className="h-6 w-6 text-primary-600" />
          <p className="text-lg font-medium text-primary-700">Montant total</p>
        </div>
        <p className="text-3xl font-bold text-primary-700">
          {totalAmount.toLocaleString('fr-FR')} MAD
        </p>
      </div>
    </div>
  );
}
