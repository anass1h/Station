import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { NozzleSelector, IndexInput, Nozzle } from '@/components/pompiste';
import { useAuthStore } from '@/stores/authStore';
import { nozzleService, NozzleWithStatus } from '@/services/nozzleService';
import { shiftService } from '@/services/shiftService';

type Step = 'select-nozzle' | 'enter-index' | 'confirm';

export function StartShiftPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('select-nozzle');
  const [nozzles, setNozzles] = useState<NozzleWithStatus[]>([]);
  const [selectedNozzle, setSelectedNozzle] = useState<Nozzle | null>(null);
  const [indexValue, setIndexValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadNozzles();
  }, [user]);

  const loadNozzles = async () => {
    if (!user?.stationId) {
      setError('Station non configuree');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await nozzleService.getAvailableNozzles(user.stationId);
      setNozzles(data);
    } catch (err) {
      console.error('Error loading nozzles:', err);
      setError('Erreur lors du chargement des pistolets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNozzle = (nozzle: Nozzle) => {
    setSelectedNozzle(nozzle);
    setIndexValue(nozzle.currentIndex.toString());
    setStep('enter-index');
  };

  const handleIndexNext = () => {
    const indexNum = parseFloat(indexValue) || 0;
    if (selectedNozzle && indexNum >= selectedNozzle.currentIndex) {
      setStep('confirm');
    }
  };

  const handleStartShift = async () => {
    if (!selectedNozzle) return;

    const indexNum = parseFloat(indexValue) || 0;

    setSubmitting(true);
    setError(null);

    try {
      await shiftService.startShift({
        nozzleId: selectedNozzle.id,
        indexStart: indexNum,
      });

      // Navigate to shift in progress
      navigate('/pompiste/shift-en-cours', { replace: true });
    } catch (err: unknown) {
      console.error('Error starting shift:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors du demarrage du shift';
      setError(message);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const indexNum = parseFloat(indexValue) || 0;
  const isIndexValid = selectedNozzle ? indexNum >= selectedNozzle.currentIndex : false;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (step === 'enter-index') {
              setStep('select-nozzle');
              setSelectedNozzle(null);
            } else if (step === 'confirm') {
              setStep('enter-index');
            } else {
              navigate('/pompiste');
            }
          }}
          className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Demarrer un Shift</h1>
          <p className="text-sm text-secondary-500">
            {step === 'select-nozzle' && 'Etape 1: Selectionnez un pistolet'}
            {step === 'enter-index' && 'Etape 2: Saisissez l\'index'}
            {step === 'confirm' && 'Etape 3: Confirmation'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {['select-nozzle', 'enter-index', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              i <= ['select-nozzle', 'enter-index', 'confirm'].indexOf(step)
                ? 'bg-primary-500'
                : 'bg-secondary-200'
            }`}
          />
        ))}
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

      {/* Step 1: Select Nozzle */}
      {step === 'select-nozzle' && (
        <div className="space-y-4">
          <p className="text-secondary-600">
            Choisissez le pistolet sur lequel vous allez travailler :
          </p>
          <NozzleSelector
            nozzles={nozzles}
            selectedId={selectedNozzle?.id || null}
            onSelect={handleSelectNozzle}
            loading={loading}
          />
          {loading && (
            <div className="text-center py-4">
              <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Enter Index */}
      {step === 'enter-index' && selectedNozzle && (
        <div className="space-y-6">
          {/* Selected nozzle info */}
          <div className="bg-primary-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-primary-600">Pistolet selectionne</p>
                <p className="text-xl font-bold text-primary-900">{selectedNozzle.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-600">Carburant</p>
                <p className="font-semibold text-primary-900">{selectedNozzle.fuelType.name}</p>
              </div>
            </div>
          </div>

          {/* Index input */}
          <IndexInput
            value={indexValue}
            onChange={setIndexValue}
            min={selectedNozzle.currentIndex}
            label="Index compteur (litres)"
            error={!isIndexValid && indexValue ? `L'index doit etre >= ${selectedNozzle.currentIndex}` : undefined}
          />

          {/* Next button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full h-16 text-lg"
            onClick={handleIndexNext}
            disabled={!isIndexValid}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && selectedNozzle && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border-2 border-primary-200 p-6">
            <h2 className="text-xl font-bold text-center text-secondary-900 mb-6">
              Recapitulatif
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-secondary-100">
                <span className="text-secondary-600">Pistolet</span>
                <span className="font-semibold text-secondary-900">{selectedNozzle.reference}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-secondary-100">
                <span className="text-secondary-600">Distributeur</span>
                <span className="font-semibold text-secondary-900">{selectedNozzle.dispenser.reference}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-secondary-100">
                <span className="text-secondary-600">Carburant</span>
                <span className="font-semibold text-secondary-900">{selectedNozzle.fuelType.name}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-secondary-600">Index debut</span>
                <span className="text-2xl font-bold text-primary-600 font-mono">
                  {parseFloat(indexValue).toLocaleString('fr-FR')} L
                </span>
              </div>
            </div>
          </div>

          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
            <p className="text-warning-700 text-sm text-center">
              Verifiez que l'index correspond bien a l'affichage du compteur avant de confirmer.
            </p>
          </div>

          <Button
            variant="success"
            size="lg"
            className="w-full h-16 text-lg"
            onClick={() => setShowConfirmModal(true)}
            loading={submitting}
          >
            <PlayIcon className="h-6 w-6 mr-2" />
            Demarrer le Shift
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900">Confirmer le demarrage ?</h3>
              <p className="text-secondary-500 mt-2">
                Vous allez demarrer un shift sur le pistolet {selectedNozzle?.reference}
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
                variant="success"
                className="flex-1"
                onClick={handleStartShift}
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
