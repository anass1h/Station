import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { zOptionalText, LIMITS } from '../../lib/validation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { debtService, CreateDebtDto, DebtReason } from '@/services/debtService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';

const debtSchema = z.object({
  pompisteId: z.string().min(1, 'Le pompiste est requis'),
  reason: z.enum(['CASH_VARIANCE', 'SALARY_ADVANCE', 'DAMAGE', 'FUEL_LOSS', 'OTHER']),
  initialAmount: z.number().positive('Le montant doit etre positif'),
  description: zOptionalText(LIMITS.NOTE_SHORT),
});

type DebtFormData = z.infer<typeof debtSchema>;

export function NewDebtPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const { data: pompistes = [] } = useQuery({
    queryKey: ['pompistes', stationId],
    queryFn: () => userService.getPompistes(stationId),
    enabled: !!stationId,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      pompisteId: '',
      reason: 'CASH_VARIANCE',
      initialAmount: 0,
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDebtDto) => debtService.createDebt(stationId, data),
    onSuccess: (debt) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtsOverview'] });
      navigate(`/dettes/${debt.id}`);
    },
  });

  const onSubmit = (data: DebtFormData) => {
    createMutation.mutate({
      pompisteId: data.pompisteId,
      reason: data.reason as DebtReason,
      initialAmount: data.initialAmount,
      description: data.description || undefined,
    });
  };

  const pompisteOptions = pompistes.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
  }));

  const reasonOptions = [
    { value: 'CASH_VARIANCE', label: 'Écart de caisse' },
    { value: 'SALARY_ADVANCE', label: 'Avance sur salaire' },
    { value: 'DAMAGE', label: 'Casse/Dégât' },
    { value: 'FUEL_LOSS', label: 'Perte carburant' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dettes')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Nouvelle dette</h1>
          <p className="text-secondary-500">Enregistrer une dette pompiste</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <Controller
          name="pompisteId"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Pompiste"
              options={pompisteOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.pompisteId?.message}
              required
              searchable
            />
          )}
        />

        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Raison"
              options={reasonOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.reason?.message}
              required
            />
          )}
        />

        <FormField
          label="Montant (MAD)"
          type="number"
          step="0.01"
          {...register('initialAmount', { valueAsNumber: true })}
          error={errors.initialAmount?.message}
          required
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Description / Details
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Details supplementaires sur la dette..."
          />
          {errors.description && (
            <p className="text-sm text-danger-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/dettes')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Creation...' : 'Creer la dette'}
          </button>
        </div>
      </form>
    </div>
  );
}
