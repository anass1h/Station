import { useState } from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  TicketIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { NumericKeypad } from './NumericKeypad';

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  requiresReference: boolean;
  isActive: boolean;
}

export interface PaymentEntry {
  methodId: string;
  amount: number;
  reference?: string;
}

interface PaymentSelectorProps {
  methods: PaymentMethod[];
  totalAmount: number;
  onSelect: (payments: PaymentEntry[]) => void;
  allowMultiple?: boolean;
  initialPayments?: PaymentEntry[];
}

// Icons for payment methods
const methodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CASH: BanknotesIcon,
  CARD: CreditCardIcon,
  VOUCHER: TicketIcon,
  CREDIT: ClockIcon,
  MOBILE: DevicePhoneMobileIcon,
};

// Colors for payment methods
const methodColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  CASH: { bg: 'bg-success-50', border: 'border-success-300', text: 'text-success-700', iconBg: 'bg-success-100' },
  CARD: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  VOUCHER: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', iconBg: 'bg-purple-100' },
  CREDIT: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  MOBILE: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', iconBg: 'bg-cyan-100' },
};

export function PaymentSelector({
  methods,
  totalAmount,
  onSelect,
  allowMultiple = false,
  initialPayments = [],
}: PaymentSelectorProps) {
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    initialPayments.length > 0 ? initialPayments[0].methodId : null
  );
  const [payments, setPayments] = useState<PaymentEntry[]>(initialPayments);
  const [isMultiMode, setIsMultiMode] = useState(allowMultiple && initialPayments.length > 1);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [editingReference, setEditingReference] = useState<string>('');

  const getIcon = (code: string) => methodIcons[code.toUpperCase()] || QuestionMarkCircleIcon;
  const getColors = (code: string) => methodColors[code.toUpperCase()] || {
    bg: 'bg-secondary-50',
    border: 'border-secondary-300',
    text: 'text-secondary-700',
    iconBg: 'bg-secondary-100',
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;

  const handleMethodClick = (method: PaymentMethod) => {
    if (!isMultiMode) {
      // Single mode - select this method with full amount
      const entry: PaymentEntry = {
        methodId: method.id,
        amount: totalAmount,
      };
      setSelectedMethodId(method.id);
      setPayments([entry]);
      onSelect([entry]);

      if (method.requiresReference) {
        setEditingMethodId(method.id);
        setEditingAmount(totalAmount.toString());
      }
    } else {
      // Multi mode - start editing this method
      const existingPayment = payments.find(p => p.methodId === method.id);
      setEditingMethodId(method.id);
      setEditingAmount(existingPayment?.amount.toString() || remaining.toString());
      setEditingReference(existingPayment?.reference || '');
    }
  };

  const handleSavePayment = () => {
    if (!editingMethodId) return;

    const amount = parseFloat(editingAmount) || 0;
    if (amount <= 0) return;

    const method = methods.find(m => m.id === editingMethodId);
    if (!method) return;

    const newPayment: PaymentEntry = {
      methodId: editingMethodId,
      amount,
      reference: method.requiresReference ? editingReference : undefined,
    };

    let newPayments: PaymentEntry[];
    if (isMultiMode) {
      // Update or add payment
      const existingIndex = payments.findIndex(p => p.methodId === editingMethodId);
      if (existingIndex >= 0) {
        newPayments = [...payments];
        newPayments[existingIndex] = newPayment;
      } else {
        newPayments = [...payments, newPayment];
      }
    } else {
      newPayments = [newPayment];
    }

    setPayments(newPayments);
    onSelect(newPayments);
    setEditingMethodId(null);
    setEditingAmount('');
    setEditingReference('');
  };

  const handleRemovePayment = (methodId: string) => {
    const newPayments = payments.filter(p => p.methodId !== methodId);
    setPayments(newPayments);
    onSelect(newPayments);
  };

  const selectedMethod = editingMethodId ? methods.find(m => m.id === editingMethodId) : null;

  return (
    <div className="space-y-4">
      {/* Multi-mode toggle */}
      {allowMultiple && (
        <div className="flex items-center justify-between bg-secondary-50 rounded-lg p-3">
          <span className="text-sm font-medium text-secondary-700">Paiement mixte</span>
          <button
            type="button"
            onClick={() => {
              setIsMultiMode(!isMultiMode);
              if (!isMultiMode) {
                setPayments([]);
                setSelectedMethodId(null);
                onSelect([]);
              }
            }}
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${isMultiMode ? 'bg-primary-600' : 'bg-secondary-300'}
            `}
          >
            <span
              className={`
                absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                ${isMultiMode ? 'translate-x-6' : ''}
              `}
            />
          </button>
        </div>
      )}

      {/* Payment methods grid */}
      {!editingMethodId && (
        <div className="grid grid-cols-2 gap-3">
          {methods.filter(m => m.isActive).map((method) => {
            const Icon = getIcon(method.code);
            const colors = getColors(method.code);
            const isSelected = selectedMethodId === method.id || payments.some(p => p.methodId === method.id);
            const payment = payments.find(p => p.methodId === method.id);

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodClick(method)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                    : `${colors.border} ${colors.bg} hover:shadow-md`
                  }
                `}
              >
                {isSelected && (
                  <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-primary-600" />
                )}

                <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>

                <p className={`font-semibold ${isSelected ? 'text-primary-700' : colors.text}`}>
                  {method.name}
                </p>

                {payment && (
                  <p className="text-lg font-bold text-primary-600 mt-1">
                    {payment.amount.toLocaleString('fr-FR')} MAD
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Amount editor */}
      {editingMethodId && selectedMethod && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getIcon(selectedMethod.code);
                const colors = getColors(selectedMethod.code);
                return (
                  <>
                    <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <span className="font-semibold text-secondary-900">{selectedMethod.name}</span>
                  </>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingMethodId(null);
                setEditingAmount('');
              }}
              className="text-secondary-500 hover:text-secondary-700"
            >
              Annuler
            </button>
          </div>

          <NumericKeypad
            value={editingAmount}
            onChange={setEditingAmount}
            decimal={true}
            showDisplay={true}
            displayLabel="Montant"
            displayUnit="MAD"
          />

          {selectedMethod.requiresReference && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Reference (N° transaction, bon, etc.)
              </label>
              <input
                type="text"
                value={editingReference}
                onChange={(e) => setEditingReference(e.target.value)}
                className="w-full px-4 py-3 text-lg border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Entrez la reference"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSavePayment}
            disabled={!editingAmount || parseFloat(editingAmount) <= 0}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Valider
          </button>
        </div>
      )}

      {/* Summary for multi-mode */}
      {isMultiMode && payments.length > 0 && !editingMethodId && (
        <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
          <p className="font-medium text-secondary-700">Recapitulatif</p>
          {payments.map((payment) => {
            const method = methods.find(m => m.id === payment.methodId);
            if (!method) return null;
            return (
              <div key={payment.methodId} className="flex items-center justify-between">
                <span className="text-secondary-600">{method.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{payment.amount.toLocaleString('fr-FR')} MAD</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePayment(payment.methodId)}
                    className="text-danger-500 hover:text-danger-700 text-sm"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
          <div className="pt-3 border-t border-secondary-200 flex items-center justify-between">
            <span className="font-medium text-secondary-700">Reste a payer</span>
            <span className={`text-xl font-bold ${remaining > 0 ? 'text-danger-600' : 'text-success-600'}`}>
              {remaining.toLocaleString('fr-FR')} MAD
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
