import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  StopIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { ShiftSummaryCard } from '@/components/pompiste';
import { shiftService, Shift } from '@/services/shiftService';
import { saleService, Sale, ShiftSalesSummary } from '@/services/saleService';

export function ShiftInProgressPage() {
  const navigate = useNavigate();

  const [shift, setShift] = useState<Shift | null>(null);
  const [summary, setSummary] = useState<ShiftSalesSummary | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const loadData = useCallback(async () => {
    try {
      // Get current shift
      const currentShift = await shiftService.getCurrentShift();

      if (!currentShift || currentShift.status !== 'OPEN') {
        // No active shift, redirect to home
        navigate('/pompiste', { replace: true });
        return;
      }

      setShift(currentShift);

      // Load sales summary and recent sales
      const [salesSummary, sales] = await Promise.all([
        saleService.getShiftSalesSummary(currentShift.id).catch(() => null),
        saleService.getSalesByShift(currentShift.id).catch(() => []),
      ]);

      setSummary(salesSummary);
      setRecentSales(sales.slice(0, 5));
    } catch (err) {
      console.error('Error loading shift data:', err);
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update elapsed time every second
  useEffect(() => {
    if (!shift) return;

    const updateElapsedTime = () => {
      const start = new Date(shift.startedAt).getTime();
      const now = Date.now();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [shift]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Chargement du shift...</p>
        </div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-danger-600 mx-auto mb-4" />
          <p className="text-danger-700">{error || 'Shift non trouve'}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/pompiste')}
          >
            Retour a l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const nozzle = shift.nozzle;
  const currentIndex = nozzle?.currentIndex || shift.indexStart;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Timer Header */}
      <div className="bg-primary-600 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8" />
            <div>
              <p className="text-primary-200 text-sm">Shift en cours</p>
              <p className="text-3xl font-bold font-mono">{elapsedTime}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-primary-700 hover:bg-primary-800 transition-colors"
            title="Actualiser"
          >
            <ArrowPathIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Shift Summary */}
      {nozzle && (
        <ShiftSummaryCard
          nozzleReference={nozzle.reference}
          fuelTypeName={nozzle.tank?.fuelType?.name || 'Carburant'}
          indexStart={shift.indexStart}
          currentIndex={currentIndex}
          salesCount={summary?.salesCount || 0}
          totalAmount={summary?.totalAmount || 0}
          startedAt={shift.startedAt}
        />
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="success"
          size="lg"
          className="h-20 text-lg flex-col gap-1"
          onClick={() => navigate('/pompiste/nouvelle-vente')}
        >
          <PlusIcon className="h-8 w-8" />
          Nouvelle Vente
        </Button>

        <Button
          variant="warning"
          size="lg"
          className="h-20 text-lg flex-col gap-1"
          onClick={() => navigate('/pompiste/cloturer-shift')}
        >
          <StopIcon className="h-8 w-8" />
          Cloturer
        </Button>
      </div>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Dernieres ventes
          </h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0"
              >
<div>
  <p className="font-medium text-secondary-900">
    {Number(sale.quantity).toFixed(2)} L
  </p>
  <p className="text-sm text-secondary-500">
    {new Date(sale.soldAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}
  </p>
</div>

                <p className="font-bold text-primary-600">
                  {sale.totalAmount.toLocaleString('fr-FR')} MAD
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {summary && summary.byPaymentMethod.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Par moyen de paiement
          </h3>
          <div className="space-y-2">
            {summary.byPaymentMethod.map((method) => (
              <div
                key={method.methodId}
                className="flex items-center justify-between py-2"
              >
                <span className="text-secondary-600">{method.methodName}</span>
                <span className="font-semibold">
                  {method.amount.toLocaleString('fr-FR')} MAD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
