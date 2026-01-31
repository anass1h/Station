import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { NumericKeypad } from '@/components/pompiste';
import { shiftService, Shift } from '@/services/shiftService';
import { saleService, PaymentMethod, ShiftSalesSummary } from '@/services/saleService';
import { cashRegisterService } from '@/services/cashRegisterService';

interface PaymentRow {
  methodId: string;
  methodName: string;
  methodCode: string;
  expected: number;
  actual: string;
  reference: string;
}

export function CashRegisterPage() {
  const navigate = useNavigate();

  const [shift, setShift] = useState<Shift | null>(null);
  const [, setSummary] = useState<ShiftSalesSummary | null>(null);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [varianceNote, setVarianceNote] = useState('');
  const [createDebtOnNegative, setCreateDebtOnNegative] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the most recent closed shift
      const currentShift = await shiftService.getCurrentShift();

      // If there's still an open shift, redirect to end it first
      if (currentShift && currentShift.status === 'OPEN') {
        navigate('/pompiste/cloturer-shift', { replace: true });
        return;
      }

      // For demo purposes, we'll work with the shift data we have
      // In production, you'd get the closed shift that needs cash register
      setShift(currentShift);

      // Load payment methods
      const methods = await saleService.getPaymentMethods();
      const activeMethod = methods.filter((m: PaymentMethod) => m.isActive);

      // Load summary if we have a shift
      let salesSummary: ShiftSalesSummary | null = null;
      if (currentShift) {
        salesSummary = await saleService.getShiftSalesSummary(currentShift.id).catch(() => null);
        setSummary(salesSummary);
      }

      // Build payment rows
      const rows: PaymentRow[] = activeMethod.map((method: PaymentMethod) => {
        const methodSummary = salesSummary?.byPaymentMethod.find(
          (m) => m.methodId === method.id
        );
        return {
          methodId: method.id,
          methodName: method.name,
          methodCode: method.code,
          expected: methodSummary?.amount || 0,
          actual: (methodSummary?.amount || 0).toString(),
          reference: '',
        };
      });

      setPaymentRows(rows);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAmount = (methodId: string) => {
    const row = paymentRows.find((r) => r.methodId === methodId);
    if (row) {
      setEditingMethodId(methodId);
      setEditingValue(row.actual);
    }
  };

  const handleSaveAmount = () => {
    if (!editingMethodId) return;

    setPaymentRows((prev) =>
      prev.map((row) =>
        row.methodId === editingMethodId
          ? { ...row, actual: editingValue }
          : row
      )
    );
    setEditingMethodId(null);
    setEditingValue('');
  };

  const handleSubmit = async () => {
    if (!shift) {
      setError('Shift non trouve');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await cashRegisterService.closeCashRegister({
        shiftId: shift.id,
        details: paymentRows.map((row) => ({
          paymentMethodId: row.methodId,
          actualAmount: parseFloat(row.actual) || 0,
          reference: row.reference || undefined,
        })),
        varianceNote: varianceNote || undefined,
        createDebtOnNegativeVariance: createDebtOnNegative,
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/pompiste', { replace: true });
      }, 3000);
    } catch (err: unknown) {
      console.error('Error closing cash register:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors de la cloture de caisse';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const totalExpected = paymentRows.reduce((sum, row) => sum + row.expected, 0);
  const totalActual = paymentRows.reduce((sum, row) => sum + (parseFloat(row.actual) || 0), 0);
  const totalVariance = totalActual - totalExpected;
  const hasSignificantVariance = Math.abs(totalVariance) > 50;

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

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-success-50 border-2 border-success-200 rounded-xl p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-success-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-success-800 mb-2">
            Caisse cloturee!
          </h2>
          <p className="text-success-600 mb-4">
            Votre shift est termine.
          </p>
          {totalVariance !== 0 && (
            <p className={`text-lg font-semibold ${totalVariance < 0 ? 'text-danger-600' : 'text-success-600'}`}>
              Ecart : {totalVariance > 0 ? '+' : ''}{totalVariance.toLocaleString('fr-FR')} MAD
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pompiste')}
          className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Cloture de Caisse</h1>
          <p className="text-sm text-secondary-500">
            Declarez les montants encaisses
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

      {/* Amount Editor Modal */}
      {editingMethodId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-secondary-900">
                {paymentRows.find((r) => r.methodId === editingMethodId)?.methodName}
              </h3>
              <p className="text-sm text-secondary-500">
                Attendu: {paymentRows.find((r) => r.methodId === editingMethodId)?.expected.toLocaleString('fr-FR')} MAD
              </p>
            </div>

            <NumericKeypad
              value={editingValue}
              onChange={setEditingValue}
              decimal={true}
              showDisplay={true}
              displayLabel="Montant declare"
              displayUnit="MAD"
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setEditingMethodId(null);
                  setEditingValue('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSaveAmount}
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Table */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Detail par moyen de paiement</h3>

        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-secondary-500 pb-2 border-b border-secondary-200">
            <div>Moyen</div>
            <div className="text-right">Attendu</div>
            <div className="text-right">Declare</div>
            <div className="text-right">Ecart</div>
          </div>

          {/* Rows */}
          {paymentRows.map((row) => {
            const actual = parseFloat(row.actual) || 0;
            const variance = actual - row.expected;
            const hasVariance = variance !== 0;

            return (
              <div
                key={row.methodId}
                className="grid grid-cols-4 gap-2 items-center py-3 border-b border-secondary-100"
              >
                <div className="font-medium text-secondary-900 text-sm">
                  {row.methodName}
                </div>
                <div className="text-right text-secondary-600">
                  {row.expected.toLocaleString('fr-FR')}
                </div>
                <button
                  type="button"
                  onClick={() => handleEditAmount(row.methodId)}
                  className="text-right font-semibold text-primary-600 hover:text-primary-800 underline"
                >
                  {actual.toLocaleString('fr-FR')}
                </button>
                <div
                  className={`text-right font-semibold ${
                    !hasVariance
                      ? 'text-secondary-400'
                      : variance > 0
                        ? 'text-success-600'
                        : 'text-danger-600'
                  }`}
                >
                  {hasVariance ? (variance > 0 ? '+' : '') + variance.toLocaleString('fr-FR') : '-'}
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="grid grid-cols-4 gap-2 items-center py-3 bg-secondary-50 -mx-4 px-4 mt-2">
            <div className="font-bold text-secondary-900">TOTAL</div>
            <div className="text-right font-bold text-secondary-900">
              {totalExpected.toLocaleString('fr-FR')}
            </div>
            <div className="text-right font-bold text-secondary-900">
              {totalActual.toLocaleString('fr-FR')}
            </div>
            <div
              className={`text-right font-bold text-lg ${
                totalVariance === 0
                  ? 'text-success-600'
                  : totalVariance > 0
                    ? 'text-success-600'
                    : 'text-danger-600'
              }`}
            >
              {totalVariance !== 0 ? (totalVariance > 0 ? '+' : '') + totalVariance.toLocaleString('fr-FR') : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Variance Warning & Note */}
      {hasSignificantVariance && (
        <div className="card bg-warning-50 border border-warning-200">
          <div className="flex items-start gap-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-warning-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-warning-800">Ecart significatif detecte</p>
              <p className="text-sm text-warning-700">
                Veuillez justifier l'ecart de {Math.abs(totalVariance).toLocaleString('fr-FR')} MAD
              </p>
            </div>
          </div>

          <textarea
            value={varianceNote}
            onChange={(e) => setVarianceNote(e.target.value)}
            placeholder="Expliquez la raison de l'ecart..."
            className="w-full px-4 py-3 border border-warning-300 rounded-xl focus:ring-2 focus:ring-warning-500 focus:border-warning-500 resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Create Debt Option */}
      {totalVariance < 0 && (
        <div className="card">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createDebtOnNegative}
              onChange={(e) => setCreateDebtOnNegative(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-secondary-900">
                Creer une dette pour l'ecart negatif
              </p>
              <p className="text-sm text-secondary-500">
                Un montant de {Math.abs(totalVariance).toLocaleString('fr-FR')} MAD sera enregistre comme dette
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Submit Button */}
      <Button
        variant="success"
        size="lg"
        className="w-full h-16 text-lg"
        onClick={handleSubmit}
        loading={submitting}
        disabled={hasSignificantVariance && !varianceNote.trim()}
      >
        <CheckIcon className="h-6 w-6 mr-2" />
        Valider la Caisse
      </Button>
    </div>
  );
}
