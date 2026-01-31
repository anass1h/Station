import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { IndexInput } from '@/components/pompiste';
import { shiftService, Shift } from '@/services/shiftService';
import { saleService, ShiftSalesSummary } from '@/services/saleService';

export function EndShiftPage() {
  const navigate = useNavigate();

  const [shift, setShift] = useState<Shift | null>(null);
  const [summary, setSummary] = useState<ShiftSalesSummary | null>(null);
  const [indexEnd, setIndexEnd] = useState('');
  const [incidentNote, setIncidentNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentShift = await shiftService.getCurrentShift();

      if (!currentShift || currentShift.status !== 'OPEN') {
        navigate('/pompiste', { replace: true });
        return;
      }

      setShift(currentShift);

      // Pre-fill with current nozzle index
      if (currentShift.nozzle) {
        setIndexEnd(currentShift.nozzle.currentIndex.toString());
      }

      // Load sales summary
      const salesSummary = await saleService.getShiftSalesSummary(currentShift.id).catch(() => null);
      setSummary(salesSummary);
    } catch (err) {
      console.error('Error loading shift:', err);
      setError('Erreur lors du chargement du shift');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!shift) return;

    const indexEndNum = parseFloat(indexEnd) || 0;

    setSubmitting(true);
    setError(null);

    try {
      await shiftService.endShift(shift.id, {
        indexEnd: indexEndNum,
        incidentNote: incidentNote || undefined,
      });

      // Navigate to cash register page
      navigate('/pompiste/cloture-caisse', { replace: true });
    } catch (err: unknown) {
      console.error('Error ending shift:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors de la cloture du shift';
      setError(message);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const indexEndNum = parseFloat(indexEnd) || 0;
  const isIndexValid = shift ? indexEndNum >= shift.indexStart : false;
  const litersTotal = shift ? indexEndNum - shift.indexStart : 0;

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

  if (!shift) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-danger-600 mx-auto mb-4" />
          <p className="text-danger-700">Shift non trouve</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pompiste/shift-en-cours')}
          className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Cloturer le Shift</h1>
          <p className="text-sm text-secondary-500">
            Pistolet {shift.nozzle?.reference}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
            <p className="text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Shift Summary */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Recapitulatif du shift</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-secondary-100">
            <span className="text-secondary-600">Debut du shift</span>
            <span className="font-medium">
              {new Date(shift.startedAt).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-secondary-100">
            <span className="text-secondary-600">Pistolet</span>
            <span className="font-medium">{shift.nozzle?.reference}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-secondary-100">
            <span className="text-secondary-600">Carburant</span>
            <span className="font-medium">{shift.nozzle?.tank?.fuelType?.name}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-secondary-100">
            <span className="text-secondary-600">Index debut</span>
            <span className="font-mono font-semibold">{shift.indexStart.toLocaleString('fr-FR')} L</span>
          </div>

          {summary && (
            <>
              <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                <span className="text-secondary-600">Nombre de ventes</span>
                <span className="font-semibold">{summary.salesCount}</span>
              </div>

              <div className="flex justify-between items-center py-2 bg-success-50 -mx-4 px-4">
                <span className="text-success-700 font-medium">Chiffre d'affaires</span>
                <span className="text-xl font-bold text-success-700">
                  {summary.totalAmount.toLocaleString('fr-FR')} MAD
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Index End Input */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Index de fin</h3>
        <IndexInput
          value={indexEnd}
          onChange={setIndexEnd}
          min={shift.indexStart}
          label="Relevez l'index du compteur"
        />

        {isIndexValid && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-primary-700">Litres vendus (calcule)</span>
              <span className="text-xl font-bold text-primary-700 font-mono">
                {litersTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} L
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Incident Note */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Incidents / Remarques</h3>
        <textarea
          value={incidentNote}
          onChange={(e) => setIncidentNote(e.target.value)}
          placeholder="Signalez ici tout incident ou remarque particuliere (optionnel)"
          className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button
        variant="warning"
        size="lg"
        className="w-full h-16 text-lg"
        onClick={() => setShowConfirmModal(true)}
        disabled={!isIndexValid}
      >
        <ArrowRightOnRectangleIcon className="h-6 w-6 mr-2" />
        Cloturer le Shift
      </Button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-warning-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900">Confirmer la cloture ?</h3>
              <p className="text-secondary-500 mt-2">
                Index de fin : {indexEndNum.toLocaleString('fr-FR')} L
              </p>
              <p className="text-primary-600 font-semibold">
                Litres vendus : {litersTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} L
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                variant="warning"
                className="flex-1"
                onClick={handleEndShift}
                loading={submitting}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
