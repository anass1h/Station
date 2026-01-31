interface TankGaugeProps {
  name: string;
  reference: string;
  currentLevel: number;
  capacity: number;
  lowThreshold: number;
  loading?: boolean;
}

export function TankGauge({
  name,
  reference,
  currentLevel,
  capacity,
  lowThreshold,
  loading = false,
}: TankGaugeProps) {
  const percentage = Math.round((currentLevel / capacity) * 100);
  const isLow = currentLevel <= lowThreshold;
  const isCritical = percentage < 20;

  // Determine color based on level
  const getColor = () => {
    if (isCritical) return { bg: 'bg-danger-500', text: 'text-danger-600', light: 'bg-danger-100' };
    if (percentage < 50) return { bg: 'bg-warning-500', text: 'text-warning-600', light: 'bg-warning-100' };
    return { bg: 'bg-success-500', text: 'text-success-600', light: 'bg-success-100' };
  };

  const colors = getColor();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-4 animate-pulse">
        <div className="h-4 bg-secondary-200 rounded w-20 mb-2" />
        <div className="h-32 bg-secondary-100 rounded mb-3" />
        <div className="h-4 bg-secondary-200 rounded w-24" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
      isLow ? 'border-danger-300' : 'border-secondary-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-secondary-900">{name}</p>
          <p className="text-xs text-secondary-500">{reference}</p>
        </div>
        {isLow && (
          <span className="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded-full">
            Bas
          </span>
        )}
      </div>

      {/* Gauge */}
      <div className="relative h-32 mb-3">
        {/* Background */}
        <div className={`absolute inset-x-0 bottom-0 ${colors.light} rounded-lg h-full`} />

        {/* Fill */}
        <div
          className={`absolute inset-x-0 bottom-0 ${colors.bg} rounded-lg transition-all duration-500`}
          style={{ height: `${percentage}%` }}
        />

        {/* Level indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/90 rounded-lg px-3 py-2 shadow-sm">
            <p className={`text-3xl font-bold ${colors.text}`}>{percentage}%</p>
          </div>
        </div>

        {/* Low threshold line */}
        <div
          className="absolute inset-x-2 h-0.5 bg-danger-400 z-10"
          style={{ bottom: `${(lowThreshold / capacity) * 100}%` }}
        >
          <span className="absolute -right-1 -top-3 text-[10px] text-danger-500">
            Seuil
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-secondary-500">Niveau</span>
          <span className="font-medium text-secondary-900">
            {currentLevel.toLocaleString('fr-FR')} L
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary-500">Capacite</span>
          <span className="font-medium text-secondary-900">
            {capacity.toLocaleString('fr-FR')} L
          </span>
        </div>
      </div>
    </div>
  );
}

interface TankGaugesGridProps {
  tanks: Array<{
    tankId: string;
    fuelType: string;
    reference: string;
    currentLevel: number;
    capacity: number;
    lowThreshold: number;
  }>;
  loading?: boolean;
}

export function TankGaugesGrid({ tanks, loading = false }: TankGaugesGridProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-5 bg-secondary-200 rounded w-32 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <TankGauge
              key={i}
              name=""
              reference=""
              currentLevel={0}
              capacity={100}
              lowThreshold={20}
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">
        Etat des Cuves
      </h3>

      {tanks.length === 0 ? (
        <div className="py-8 text-center text-secondary-500">
          Aucune cuve configuree
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tanks.map((tank) => (
            <TankGauge
              key={tank.tankId}
              name={tank.fuelType}
              reference={tank.reference}
              currentLevel={tank.currentLevel}
              capacity={tank.capacity}
              lowThreshold={tank.lowThreshold}
            />
          ))}
        </div>
      )}
    </div>
  );
}
