import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { debtService, PompisteDebt, AddPaymentDto } from '@/services/debtService';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { formatCurrency } from '@/utils/exportExcel';

interface DebtPaymentModalProps {
  debt: PompisteDebt;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentSchema = z.object({
  amount: z.number().positive('Le montant doit etre positif'),
  paymentMethod: z.enum(['CASH', 'SALARY_DEDUCTION', 'OTHER']),
  note: z.string().optional(),
  paymentDate: z.string().min(1, 'La date est requise'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function DebtPaymentModal({ debt, onClose, onSuccess }: DebtPaymentModalProps) {
  const queryClient = useQueryClient();
  const paidAmount = debt.initialAmount - debt.remainingAmount;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: debt.remainingAmount,
      paymentMethod: 'CASH',
      note: '',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: AddPaymentDto) => debtService.addPayment(debt.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', debt.id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtsOverview'] });
      onSuccess();
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    addPaymentMutation.mutate({
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      note: data.note || undefined,
      paymentDate: data.paymentDate,
    });
  };

  const paymentMethodOptions = [
    { value: 'CASH', label: 'Espèces' },
    { value: 'SALARY_DEDUCTION', label: 'Retenue sur salaire' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">Enregistrer un paiement</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-secondary-600" />
          </button>
        </div>

        {/* Debt Info */}
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Pompiste</span>
            <span className="font-medium">
              {debt.pompiste?.firstName} {debt.pompiste?.lastName}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Dette totale</span>
            <span className="font-semibold">{formatCurrency(debt.initialAmount)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Deja paye</span>
            <span className="text-success-600">{formatCurrency(paidAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-secondary-200">
            <span className="font-medium text-secondary-900">Reste a payer</span>
            <span className="font-bold text-danger-600">{formatCurrency(debt.remainingAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Montant"
            type="number"
            step="0.01"
            max={debt.remainingAmount}
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            required
            hint={`Maximum: ${formatCurrency(debt.remainingAmount)}`}
          />

          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Mode de paiement"
                options={paymentMethodOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.paymentMethod?.message}
                required
              />
            )}
          />

          <FormField
            label="Date du paiement"
            type="date"
            {...register('paymentDate')}
            error={errors.paymentDate?.message}
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Note</label>
            <textarea
              {...register('note')}
              rows={2}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Note optionnelle..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || addPaymentMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting || addPaymentMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
