import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { invoiceService, AddPaymentDto, Invoice } from '@/services/invoiceService';
import { paymentMethodService } from '@/services/paymentMethodService';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { formatCurrency } from '@/utils/exportExcel';
import { zOptionalText, LIMITS } from '../../lib/validation';

interface AddPaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentSchema = z.object({
  amount: z.number().positive('Le montant doit etre positif'),
  paymentMethodId: z.string().min(1, 'Le moyen de paiement est requis'),
  reference: zOptionalText(LIMITS.REFERENCE),
  paymentDate: z.string().min(1, 'La date est requise'),
  notes: zOptionalText(LIMITS.NOTE_SHORT),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function AddPaymentModal({ invoice, onClose, onSuccess }: AddPaymentModalProps) {
  const queryClient = useQueryClient();
  const remainingAmount = invoice.totalTTC - invoice.paidAmount;

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodService.getActive,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      paymentMethodId: '',
      reference: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedMethodId = watch('paymentMethodId');
  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const addPaymentMutation = useMutation({
    mutationFn: (data: AddPaymentDto) => invoiceService.addPayment(invoice.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess();
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    addPaymentMutation.mutate({
      amount: data.amount,
      paymentMethodId: data.paymentMethodId,
      reference: data.reference || undefined,
      paymentDate: data.paymentDate,
      notes: data.notes || undefined,
    });
  };

  const paymentMethodOptions = paymentMethods.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">Ajouter un paiement</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-secondary-600" />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Facture</span>
            <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Total TTC</span>
            <span className="font-semibold">{formatCurrency(invoice.totalTTC)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-600">Deja paye</span>
            <span className="text-success-600">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-secondary-200">
            <span className="font-medium text-secondary-900">Reste a payer</span>
            <span className="font-bold text-primary-600">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Montant"
            type="number"
            step="0.01"
            max={remainingAmount}
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            required
            hint={`Maximum: ${formatCurrency(remainingAmount)}`}
          />

          <Controller
            name="paymentMethodId"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Moyen de paiement"
                options={paymentMethodOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.paymentMethodId?.message}
                required
              />
            )}
          />

          {selectedMethod?.requiresDetails && (
            <FormField
              label="Reference"
              {...register('reference')}
              error={errors.reference?.message}
              placeholder="N° cheque, transaction, etc."
            />
          )}

          <FormField
            label="Date du paiement"
            type="date"
            {...register('paymentDate')}
            error={errors.paymentDate?.message}
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notes optionnelles..."
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
