import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { shiftService } from '@/services/shiftService';
import { debtService, PompisteDebt } from '@/services/debtService';

interface DebtSummary {
  totalAmount: number;
  debtCount: number;
}

export function PompisteHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load current shift
      const shift = await shiftService.getCurrentShift();

      // If there's an active shift, redirect to shift in progress
      if (shift && shift.status === 'OPEN') {
        navigate('/pompiste/shift-en-cours', { replace: true });
        return;
      }

      // Load debts and calculate total
      const debts = await debtService.getDebtsByPompiste(user.id);
      const pendingDebts = debts.filter(
        (d: PompisteDebt) => d.status === 'PENDING' || d.status === 'PARTIALLY_PAID'
      );
      const totalAmount = pendingDebts.reduce((sum: number, d: PompisteDebt) => sum + d.remainingAmount, 0);
      setDebtSummary({
        totalAmount,
        debtCount: pendingDebts.length,
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="card text-center py-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Bonjour, {user?.firstName}!
        </h1>
        <p className="text-secondary-500 text-lg">
          Aucun shift en cours
        </p>
      </div>

      {/* Debt Alert */}
      {debtSummary && debtSummary.totalAmount > 0 && (
        <div className="bg-danger-50 border-2 border-danger-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-danger-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-danger-800">
                Vous avez une dette en cours
              </p>
              <p className="text-danger-700 text-lg font-bold mt-1">
                {debtSummary.totalAmount.toLocaleString('fr-FR')} MAD
              </p>
              <p className="text-danger-600 text-sm mt-1">
                {debtSummary.debtCount} dette{debtSummary.debtCount > 1 ? 's' : ''} non soldee{debtSummary.debtCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-center">
          <p className="text-danger-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-danger-600 hover:text-danger-800 font-medium underline"
          >
            Reessayer
          </button>
        </div>
      )}

      {/* Start Shift Button */}
      <Button
        variant="success"
        size="lg"
        className="w-full h-24 text-xl"
        onClick={() => navigate('/pompiste/demarrer-shift')}
      >
        <PlayIcon className="h-10 w-10 mr-4" />
        Demarrer un Shift
      </Button>

      {/* Info Card */}
      <div className="card bg-secondary-50 border border-secondary-200">
        <h3 className="font-medium text-secondary-700 mb-2">Instructions</h3>
        <ul className="text-sm text-secondary-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary-600">1.</span>
            <span>Selectionnez un pistolet disponible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">2.</span>
            <span>Verifiez et saisissez l'index du compteur</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">3.</span>
            <span>Confirmez pour demarrer votre shift</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
