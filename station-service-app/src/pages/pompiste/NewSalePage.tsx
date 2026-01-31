import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { SaleForm, PaymentEntry } from '@/components/pompiste';
import { shiftService, Shift } from '@/services/shiftService';
import { saleService, PaymentMethod } from '@/services/saleService';

export function NewSalePage() {
  const navigate = useNavigate();

  const [shift, setShift] = useState<Shift | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [unitPrice, setUnitPrice] = useState<number>(0);
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
      // Get current shift
      const currentShift = await shiftService.getCurrentShift();

      if (!currentShift || currentShift.status !== 'OPEN') {
        navigate('/pompiste', { replace: true });
        return;
      }

      setShift(currentShift);

      // Load payment methods
      const methods = await saleService.getPaymentMethods();
      setPaymentMethods(methods.filter(m => m.isActive));

      // Get current price for the fuel type
      if (currentShift.nozzle?.tank?.fuelType?.id && currentShift.nozzle?.dispenser?.stationId) {
        try {
          const priceData = await saleService.getCurrentPrice(
            currentShift.nozzle.dispenser.stationId,
            currentShift.nozzle.tank.fuelType.id
          );
          setUnitPrice(priceData.price);
        } catch {
          // Fallback price if API fails
          setUnitPrice(10.5);
          toast.error('Prix non disponible - utilisation du prix par defaut');
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { quantity: number; payments: PaymentEntry[] }) => {
    if (!shift || !shift.nozzle) return;

    setSubmitting(true);
    setError(null);

    try {
      await saleService.createSale({
        shiftId: shift.id,
        fuelTypeId: shift.nozzle.tank?.fuelType?.id || '',
        quantity: data.quantity,
        unitPrice: unitPrice,
        payments: data.payments.map(p => ({
          paymentMethodId: p.methodId,
          amount: p.amount,
          reference: p.reference,
        })),
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/pompiste/shift-en-cours', { replace: true });
      }, 2000);
    } catch (err: unknown) {
      console.error('Error creating sale:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors de l\'enregistrement de la vente';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/pompiste/shift-en-cours');
  };

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
            Vente enregistree!
          </h2>
          <p className="text-success-600">
            Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  if (!shift || !shift.nozzle) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-danger-600 mx-auto mb-4" />
          <p className="text-danger-700">Shift non trouve</p>
        </div>
      </div>
    );
  }

  const fuelTypeName = shift.nozzle.tank?.fuelType?.name || 'Carburant';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Nouvelle Vente</h1>
          <p className="text-sm text-secondary-500">
            Pistolet {shift.nozzle.reference} - {fuelTypeName}
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

      {/* Sale Form */}
      <div className="card">
        <SaleForm
          fuelTypeName={fuelTypeName}
          unitPrice={unitPrice}
          paymentMethods={paymentMethods}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </div>
    </div>
  );
}
