import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LIMITS } from '../../lib/validation';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { stockService, CreateAdjustmentDto } from '@/services/stockService';
import { tankService } from '@/services/tankService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { formatNumber } from '@/utils/exportExcel';

const adjustmentSchema = z.object({
  tankId: z.string().min(1, 'La cuve est requise'),
  type: z.enum(['ADJUSTMENT', 'CALIBRATION', 'LOSS']),
  quantity: z.number().refine((v) => v !== 0, 'La quantite ne peut pas etre nulle'),
  reason: z.string().min(10, 'La raison doit contenir au moins 10 caracteres').max(LIMITS.NOTE_SHORT).regex(/^[^<>]*$/, 'Les balises HTML ne sont pas autorisées').transform(v => v.trim()),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

const typeOptions = [
  { value: 'ADJUSTMENT', label: 'Ajustement (correction)' },
  { value: 'CALIBRATION', label: 'Calibration (etalonnage)' },
  { value: 'LOSS', label: 'Perte (vol, fuite, etc.)' },
];

export function StockAdjustmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const stationId = user?.stationId || '';

  const preselectedTankId = searchParams.get('tankId') || '';

  const { data: tanks = [] } = useQuery({
    queryKey: ['tanks', stationId],
    queryFn: () => tankService.getByStation(stationId),
    enabled: !!stationId,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      tankId: preselectedTankId,
      type: 'ADJUSTMENT',
      quantity: 0,
      reason: '',
    },
  });

  useEffect(() => {
    if (preselectedTankId) {
      setValue('tankId', preselectedTankId);
    }
  }, [preselectedTankId, setValue]);

  const selectedTankId = watch('tankId');
  const quantity = watch('quantity');
  const adjustmentType = watch('type');

  const selectedTank = tanks.find((t) => t.id === selectedTankId);
  const newLevel = selectedTank ? selectedTank.currentLevel + quantity : 0;
  const isValid = selectedTank && newLevel >= 0 && newLevel <= selectedTank.capacity;

  const createMutation = useMutation({
    mutationFn: (data: CreateAdjustmentDto) => stockService.createAdjustment(stationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['tanksWithStats'] });
      navigate('/operations/stock');
    },
  });

  const onSubmit = (data: AdjustmentFormData) => {
    createMutation.mutate(data);
  };

  const tankOptions = tanks.map((t) => ({
    value: t.id,
    label: `${t.reference} - ${t.fuelType?.name || 'N/A'} (${formatNumber(t.currentLevel)} L)`,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/operations/stock')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Ajustement de stock</h1>
          <p className="text-secondary-500">Corriger le niveau d'une cuve</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-warning-700">
          <p className="font-medium">Attention</p>
          <p>Les ajustements de stock sont traces et audites. Assurez-vous de fournir une raison detaillee.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <Controller
          name="tankId"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Cuve"
              options={tankOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.tankId?.message}
              required
              searchable
            />
          )}
        />

        {/* Tank Info */}
        {selectedTank && (
          <div className="p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedTank.fuelType?.color }}
              />
              <span className="font-medium text-secondary-900">
                {selectedTank.fuelType?.name} - {selectedTank.reference}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-secondary-500">Capacite</p>
                <p className="font-semibold">{formatNumber(selectedTank.capacity)} L</p>
              </div>
              <div>
                <p className="text-secondary-500">Niveau actuel</p>
                <p className="font-semibold">{formatNumber(selectedTank.currentLevel)} L</p>
              </div>
              <div>
                <p className="text-secondary-500">Remplissage</p>
                <p className="font-semibold">{((Number(selectedTank.currentLevel) / Number(selectedTank.capacity)) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Type d'ajustement"
              options={typeOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.type?.message}
              required
            />
          )}
        />

        <FormField
          label="Quantite (litres)"
          type="number"
          step="0.01"
          {...register('quantity', { valueAsNumber: true })}
          error={errors.quantity?.message}
          required
          hint={adjustmentType === 'LOSS' ? 'Entrez une valeur negative pour une perte' : 'Positif pour ajouter, negatif pour retirer'}
        />

        {/* New Level Preview */}
        {selectedTank && quantity !== 0 && (
          <div className={`p-4 rounded-lg ${isValid ? 'bg-primary-50 border border-primary-200' : 'bg-danger-50 border border-danger-200'}`}>
            <div className="flex justify-between items-center">
              <span className={isValid ? 'text-primary-700' : 'text-danger-700'}>Nouveau niveau</span>
              <span className={`text-xl font-bold ${isValid ? 'text-primary-700' : 'text-danger-700'}`}>
                {formatNumber(newLevel)} L
              </span>
            </div>
            {!isValid && (
              <p className="text-sm text-danger-600 mt-2">
                {newLevel < 0
                  ? 'Le niveau ne peut pas etre negatif'
                  : `Le niveau ne peut pas depasser la capacite (${formatNumber(selectedTank.capacity)} L)`}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Raison de l'ajustement <span className="text-danger-500">*</span>
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.reason ? 'border-danger-500' : 'border-secondary-300'
            }`}
            placeholder="Expliquez la raison de cet ajustement (min. 10 caracteres)..."
          />
          {errors.reason && (
            <p className="text-xs text-danger-600 mt-1">{errors.reason.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/operations/stock')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || !isValid}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'ajustement'}
          </button>
        </div>
      </form>
    </div>
  );
}
