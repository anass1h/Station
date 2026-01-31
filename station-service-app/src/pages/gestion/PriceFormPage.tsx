import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { priceService, CreatePriceDto } from '@/services/priceService';
import { fuelTypeService } from '@/services/fuelTypeService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TVA_RATE = 0.20;

const priceSchema = z.object({
  fuelTypeId: z.string().min(1, 'Le type de carburant est requis'),
  sellingPriceTTC: z.number().positive('Le prix TTC doit etre positif'),
  purchasePrice: z.number().positive("Le prix d'achat doit etre positif"),
  effectiveFrom: z.string().optional(),
});

type PriceFormData = z.infer<typeof priceSchema>;

export function PriceFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const stationId = user?.stationId || '';

  const { data: fuelTypes = [], isLoading: loadingFuelTypes } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: fuelTypeService.getActive,
  });

  const { data: currentPrices = [] } = useQuery({
    queryKey: ['prices', 'current', stationId],
    queryFn: () => priceService.getCurrentPrices(stationId),
    enabled: !!stationId,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PriceFormData>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      fuelTypeId: '',
      sellingPriceTTC: 0,
      purchasePrice: 0,
      effectiveFrom: new Date().toISOString().slice(0, 16),
    },
  });

  const selectedFuelTypeId = watch('fuelTypeId');
  const sellingPriceTTC = watch('sellingPriceTTC');
  const purchasePrice = watch('purchasePrice');

  // Auto-fill current prices when fuel type is selected
  useEffect(() => {
    if (selectedFuelTypeId) {
      const currentPrice = currentPrices.find((p) => p.fuelTypeId === selectedFuelTypeId);
      if (currentPrice) {
        setValue('sellingPriceTTC', currentPrice.sellingPriceTTC);
        setValue('purchasePrice', currentPrice.purchasePrice);
      }
    }
  }, [selectedFuelTypeId, currentPrices, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePriceDto) => priceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      navigate('/gestion/prix');
    },
  });

  const onSubmit = (data: PriceFormData) => {
    createMutation.mutate({
      stationId,
      fuelTypeId: data.fuelTypeId,
      sellingPriceTTC: data.sellingPriceTTC,
      purchasePrice: data.purchasePrice,
      effectiveFrom: data.effectiveFrom || undefined,
    });
  };

  // Calculations
  const sellingPriceHT = priceService.calculateHT(sellingPriceTTC, TVA_RATE);
  const margin = priceService.calculateMargin(sellingPriceHT, purchasePrice);

  if (loadingFuelTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const fuelTypeOptions = fuelTypes.map((f) => ({ value: f.id, label: f.name }));
  const selectedFuelType = fuelTypes.find((f) => f.id === selectedFuelTypeId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestion/prix')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Modifier le prix</h1>
          <p className="text-secondary-500">Definissez un nouveau prix pour un carburant</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex gap-3">
        <InformationCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-primary-700">
          <p className="font-medium">Note importante</p>
          <p>L'ancien prix sera automatiquement cloture a la date d'effet du nouveau prix.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="fuelTypeId"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Type de carburant"
                  options={fuelTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.fuelTypeId?.message}
                  required
                />
              )}
            />
          </div>

          {selectedFuelType && (
            <div className="md:col-span-2 p-3 bg-secondary-50 rounded-lg flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedFuelType.color }}
              />
              <span className="text-secondary-700">
                Carburant selectionne: <strong>{selectedFuelType.name}</strong>
              </span>
            </div>
          )}

          <FormField
            label="Prix de vente TTC (MAD/L)"
            type="number"
            step="0.01"
            {...register('sellingPriceTTC', { valueAsNumber: true })}
            error={errors.sellingPriceTTC?.message}
            required
          />
          <FormField
            label="Prix d'achat (MAD/L)"
            type="number"
            step="0.01"
            {...register('purchasePrice', { valueAsNumber: true })}
            error={errors.purchasePrice?.message}
            required
          />
          <FormField
            label="Date d'effet"
            type="datetime-local"
            {...register('effectiveFrom')}
            error={errors.effectiveFrom?.message}
            hint="Par defaut: maintenant"
          />
        </div>

        {/* Calculations Preview */}
        {sellingPriceTTC > 0 && (
          <div className="border-t border-secondary-200 pt-4">
            <h3 className="text-sm font-medium text-secondary-700 mb-3">Apercu des calculs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary-50 rounded-lg p-3 text-center">
                <p className="text-xs text-secondary-500 mb-1">Prix HT</p>
                <p className="text-lg font-semibold text-secondary-900">
                  {sellingPriceHT.toFixed(2)} MAD
                </p>
              </div>
              <div className="bg-secondary-50 rounded-lg p-3 text-center">
                <p className="text-xs text-secondary-500 mb-1">TVA (20%)</p>
                <p className="text-lg font-semibold text-secondary-900">
                  {(sellingPriceTTC - sellingPriceHT).toFixed(2)} MAD
                </p>
              </div>
              <div className={`rounded-lg p-3 text-center ${margin >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
                <p className="text-xs text-secondary-500 mb-1">Marge unitaire</p>
                <p className={`text-lg font-semibold ${margin >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {margin.toFixed(2)} MAD
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/prix')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Enregistrement...' : 'Appliquer le nouveau prix'}
          </button>
        </div>
      </form>
    </div>
  );
}
