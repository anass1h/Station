import { TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface PompisteSales {
  pompisteId: string;
  pompiste: string;
  liters: number;
  amount: number;
}

interface TopPompistesCardProps {
  pompistes: PompisteSales[];
  loading?: boolean;
}

const rankColors = [
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }, // Gold
  { bg: 'bg-secondary-100', text: 'text-secondary-600', border: 'border-secondary-200' }, // Silver
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }, // Bronze
];

export function TopPompistesCard({ pompistes, loading = false }: TopPompistesCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-5 bg-secondary-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-secondary-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-secondary-200 rounded w-24 mb-2" />
                <div className="h-2 bg-secondary-100 rounded w-full" />
              </div>
              <div className="h-4 bg-secondary-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Find max amount for progress bars
  const maxAmount = pompistes.length > 0 ? Math.max(...pompistes.map((p) => p.amount)) : 0;

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-secondary-900">
          Top Pompistes
        </h3>
      </div>

      {pompistes.length === 0 ? (
        <div className="py-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
          <p className="text-secondary-500">Aucune donnee disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pompistes.slice(0, 5).map((pompiste, index) => {
            const percentage = maxAmount > 0 ? (pompiste.amount / maxAmount) * 100 : 0;
            const rankColor = rankColors[index] || { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-100' };

            return (
              <div key={pompiste.pompisteId} className="flex items-center gap-3">
                {/* Rank */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor.bg} ${rankColor.text} border ${rankColor.border}`}
                >
                  {index + 1}
                </div>

                {/* Name and progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-secondary-900 truncate">
                      {pompiste.pompiste}
                    </p>
                    <p className="text-sm font-semibold text-secondary-700 ml-2">
                      {pompiste.amount.toLocaleString('fr-FR')} MAD
                    </p>
                  </div>
                  <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                            ? 'bg-secondary-400'
                            : index === 2
                              ? 'bg-orange-400'
                              : 'bg-primary-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    {pompiste.liters.toFixed(0)} litres vendus
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
