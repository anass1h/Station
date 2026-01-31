import { useState, useEffect } from 'react';
import { NumericKeypad } from './NumericKeypad';
import { PaymentSelector, PaymentMethod, PaymentEntry } from './PaymentSelector';
import { BeakerIcon, CurrencyDollarIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface SaleFormProps {
  fuelTypeName: string;
  unitPrice: number;
  paymentMethods: PaymentMethod[];
  onSubmit: (data: { quantity: number; payments: PaymentEntry[] }) => void;
  onCancel: () => void;
  loading?: boolean;
}

type Step = 'quantity' | 'payment' | 'confirm';

export function SaleForm({
  fuelTypeName,
  unitPrice,
  paymentMethods,
  onSubmit,
  onCancel,
  loading = false,
}: SaleFormProps) {
  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  const quantityNum = parseFloat(quantity) || 0;
  const totalAmount = Math.round(quantityNum * unitPrice * 100) / 100;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaymentComplete = Math.abs(totalPaid - totalAmount) < 0.01;

  const canProceedToPayment = quantityNum > 0;
  const canConfirm = canProceedToPayment && isPaymentComplete;

  useEffect(() => {
    // Reset payments when quantity changes
    setPayments([]);
  }, [quantity]);

  const handleNext = () => {
    if (step === 'quantity' && canProceedToPayment) {
      setStep('payment');
    } else if (step === 'payment' && isPaymentComplete) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('quantity');
    } else if (step === 'confirm') {
      setStep('payment');
    }
  };

  const handleSubmit = () => {
    if (canConfirm) {
      onSubmit({ quantity: quantityNum, payments });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {(['quantity', 'payment', 'confirm'] as Step[]).map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step === s
                  ? 'bg-primary-600 text-white'
                  : index < ['quantity', 'payment', 'confirm'].indexOf(step)
                    ? 'bg-success-500 text-white'
                    : 'bg-secondary-200 text-secondary-500'
                }
              `}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div
                className={`w-12 h-1 ${
                  index < ['quantity', 'payment', 'confirm'].indexOf(step)
                    ? 'bg-success-500'
                    : 'bg-secondary-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Quantity */}
      {step === 'quantity' && (
        <div className="space-y-4">
          {/* Fuel info */}
          <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BeakerIcon className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-semibold text-primary-900">{fuelTypeName}</p>
                <p className="text-sm text-primary-600">Prix unitaire</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary-700">
              {unitPrice.toFixed(2)} MAD/L
            </p>
          </div>

          {/* Quantity input */}
          <div>
            <p className="text-center text-lg font-medium text-secondary-700 mb-4">
              Quantite (litres)
            </p>
            <NumericKeypad
              value={quantity}
              onChange={setQuantity}
              decimal={true}
              maxLength={8}
              showDisplay={true}
              displayLabel="Quantite"
              displayUnit="L"
            />
          </div>

          {/* Total preview */}
          {quantityNum > 0 && (
            <div className="bg-success-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="h-6 w-6 text-success-600" />
                <span className="font-medium text-success-700">Total a payer</span>
              </div>
              <p className="text-2xl font-bold text-success-700">
                {totalAmount.toLocaleString('fr-FR')} MAD
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-secondary-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-secondary-600">Quantite</span>
              <span className="font-semibold">{quantityNum.toFixed(2)} L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Prix unitaire</span>
              <span className="font-semibold">{unitPrice.toFixed(2)} MAD/L</span>
            </div>
            <div className="border-t border-secondary-200 mt-3 pt-3 flex justify-between items-center">
              <span className="font-medium text-lg">Total</span>
              <span className="text-2xl font-bold text-primary-600">
                {totalAmount.toLocaleString('fr-FR')} MAD
              </span>
            </div>
          </div>

          {/* Payment selector */}
          <div>
            <p className="text-center text-lg font-medium text-secondary-700 mb-4">
              Mode de paiement
            </p>
            <PaymentSelector
              methods={paymentMethods}
              totalAmount={totalAmount}
              onSelect={setPayments}
              allowMultiple={true}
              initialPayments={payments}
            />
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border-2 border-primary-200 p-6">
            <h3 className="text-xl font-bold text-center text-secondary-900 mb-6">
              Recapitulatif de la vente
            </h3>

            <div className="space-y-4">
              {/* Fuel */}
              <div className="flex items-center gap-4 p-3 bg-secondary-50 rounded-lg">
                <BeakerIcon className="h-8 w-8 text-primary-600" />
                <div className="flex-1">
                  <p className="font-semibold text-secondary-900">{fuelTypeName}</p>
                  <p className="text-sm text-secondary-500">{unitPrice.toFixed(2)} MAD/L</p>
                </div>
                <p className="text-xl font-bold">{quantityNum.toFixed(2)} L</p>
              </div>

              {/* Payments */}
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-500 mb-2">Paiement</p>
                {payments.map((payment, index) => {
                  const method = paymentMethods.find(m => m.id === payment.methodId);
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-secondary-700">{method?.name}</span>
                      <span className="font-semibold">{payment.amount.toLocaleString('fr-FR')} MAD</span>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-success-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-success-600" />
                  <span className="text-lg font-semibold text-success-700">Total</span>
                </div>
                <p className="text-3xl font-bold text-success-700">
                  {totalAmount.toLocaleString('fr-FR')} MAD
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {step === 'quantity' ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-semibold rounded-xl transition-colors text-lg"
          >
            Annuler
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-4 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-semibold rounded-xl transition-colors text-lg"
          >
            Retour
          </button>
        )}

        {step === 'confirm' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canConfirm || loading}
            className="flex-1 py-4 bg-success-600 hover:bg-success-700 disabled:bg-secondary-300 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {loading ? 'Enregistrement...' : 'Confirmer la vente'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={step === 'quantity' ? !canProceedToPayment : !isPaymentComplete}
            className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}
