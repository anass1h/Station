import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ActiveShift {
  id: string;
  pompisteId: string;
  pompisteName: string;
  nozzleReference: string;
  fuelTypeName: string;
  startedAt: string;
  indexStart: number;
  currentIndex: number;
  salesCount: number;
  totalAmount: number;
}

interface ActiveShiftsCardProps {
  shifts: ActiveShift[];
  loading?: boolean;
  onShiftClick?: (shiftId: string) => void;
}

function ShiftDuration({ startedAt }: { startedAt: string }) {
  const [duration, setDuration] = useState('--:--');
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setDuration(`${hours}h${minutes.toString().padStart(2, '0')}`);
      setIsOvertime(hours >= 10);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className={`flex items-center gap-1 text-sm ${isOvertime ? 'text-warning-600 font-medium' : 'text-secondary-500'}`}>
      <ClockIcon className="h-4 w-4" />
      <span>{duration}</span>
      {isOvertime && <ExclamationTriangleIcon className="h-4 w-4 ml-1" />}
    </div>
  );
}

export function ActiveShiftsCard({ shifts, loading = false, onShiftClick }: ActiveShiftsCardProps) {
  const navigate = useNavigate();

  const handleClick = (shiftId: string) => {
    if (onShiftClick) {
      onShiftClick(shiftId);
    } else {
      navigate(`/shifts/${shiftId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-5 bg-secondary-200 rounded w-36 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-secondary-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-200 rounded w-24" />
                <div className="h-3 bg-secondary-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">
          Shifts en Cours
        </h3>
        <span className="px-2.5 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded-full">
          {shifts.length}
        </span>
      </div>

      {shifts.length === 0 ? (
        <div className="py-8 text-center">
          <UserIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
          <p className="text-secondary-500">Aucun shift actif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => {
            const liters = shift.currentIndex - shift.indexStart;

            return (
              <button
                key={shift.id}
                onClick={() => handleClick(shift.id)}
                className="w-full flex items-center gap-3 p-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">
                    {shift.pompisteName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary-900 truncate">
                    {shift.pompisteName}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {shift.nozzleReference} - {shift.fuelTypeName}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <ShiftDuration startedAt={shift.startedAt} />
                  <p className="text-sm font-medium text-secondary-700">
                    {liters.toFixed(0)} L
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
