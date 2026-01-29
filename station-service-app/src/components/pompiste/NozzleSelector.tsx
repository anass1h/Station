import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export interface Nozzle {
  id: string;
  reference: string;
  currentIndex: number;
  isActive: boolean;
  position: number;
  dispenser: {
    id: string;
    reference: string;
  };
  tank: {
    id: string;
    reference: string;
  };
  fuelType: {
    id: string;
    code: string;
    name: string;
  };
  isOccupied?: boolean;
}

interface NozzleSelectorProps {
  nozzles: Nozzle[];
  selectedId: string | null;
  onSelect: (nozzle: Nozzle) => void;
  loading?: boolean;
}

// Colors for fuel types
const fuelColors: Record<string, { bg: string; border: string; text: string }> = {
  GASOIL: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  SP95: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700' },
  SP98: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  DIESEL: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  default: { bg: 'bg-secondary-50', border: 'border-secondary-400', text: 'text-secondary-700' },
};

export function NozzleSelector({ nozzles, selectedId, onSelect, loading }: NozzleSelectorProps) {
  const getFuelColor = (code: string) => {
    return fuelColors[code.toUpperCase()] || fuelColors.default;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 bg-secondary-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (nozzles.length === 0) {
    return (
      <div className="text-center py-8 bg-secondary-50 rounded-xl">
        <p className="text-secondary-500 text-lg">Aucun pistolet disponible</p>
        <p className="text-secondary-400 text-sm mt-1">Contactez votre gestionnaire</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {nozzles.map((nozzle) => {
        const isSelected = selectedId === nozzle.id;
        const isAvailable = !nozzle.isOccupied && nozzle.isActive;
        const colors = getFuelColor(nozzle.fuelType.code);

        return (
          <button
            key={nozzle.id}
            type="button"
            onClick={() => isAvailable && onSelect(nozzle)}
            disabled={!isAvailable}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              ${isSelected
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                : isAvailable
                  ? `${colors.border} ${colors.bg} hover:shadow-lg hover:scale-[1.02]`
                  : 'border-secondary-200 bg-secondary-100 opacity-60 cursor-not-allowed'
              }
            `}
          >
            {/* Status indicator */}
            <div className="absolute top-2 right-2">
              {isAvailable ? (
                <CheckCircleIcon className="h-6 w-6 text-success-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-danger-500" />
              )}
            </div>

            {/* Nozzle info */}
            <div className="text-left">
              <p className={`text-xl font-bold ${isSelected ? 'text-primary-700' : colors.text}`}>
                {nozzle.reference}
              </p>
              <p className="text-sm text-secondary-500 mt-1">
                {nozzle.dispenser.reference}
              </p>
            </div>

            {/* Fuel type badge */}
            <div className={`
              mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium
              ${isSelected
                ? 'bg-primary-100 text-primary-700'
                : `${colors.bg} ${colors.text}`
              }
            `}>
              {nozzle.fuelType.name}
            </div>

            {/* Current index */}
            <div className="mt-3 pt-3 border-t border-secondary-200">
              <p className="text-xs text-secondary-400">Index actuel</p>
              <p className="text-lg font-mono font-semibold text-secondary-700">
                {nozzle.currentIndex.toLocaleString('fr-FR')} L
              </p>
            </div>

            {/* Occupied label */}
            {nozzle.isOccupied && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <span className="px-3 py-1 bg-danger-100 text-danger-700 rounded-full text-sm font-medium">
                  Occupe
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
