import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { zText, LIMITS } from '../../lib/validation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { deliveryService, CreateDeliveryDto } from '@/services/deliveryService';
import { supplierService } from '@/services/supplierService';
import { tankService } from '@/services/tankService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { formatNumber, formatCurrency } from '@/utils/exportExcel';

const deliverySchema = z.object({
  tankId: z.string().min(1, 'La cuve est requise'),
  supplierId: z.string().min(1, 'Le fournisseur est requis'),
  deliveryNumber: zText(LIMITS.REFERENCE_SHORT, 'Le numero de BL est requis'),
  quantity: z.number().positive('La quantite doit etre positive'),
  purchasePrice: z.number().positive('Le prix doit etre positif'),
  levelBefore: z.number().min(0, 'Le niveau doit etre positif'),
  levelAfter: z.number().min(0, 'Le niveau doit etre positif'),
  temperature: z.number().optional(),
  orderedQuantity: z.number().positive('La quantite commandee doit etre positive').optional(),
  deliveryDate: z.string().min(1, 'La date est requise'),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export function DeliveryFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedStationId, setSelectedStationId] = useState<string>(user?.stationId || '');

  // Fetch stations for SUPER_ADMIN
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  // Auto-select first station for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin && !selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0].id);
    }
  }, [isSuperAdmin, selectedStationId, stations]);

  const stationId = selectedStationId || user?.stationId || '';

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', stationId],
    queryFn: () => supplierService.getByStation(stationId),
    enabled: !!stationId,
  });

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
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      tankId: '',
      supplierId: '',
      deliveryNumber: '',
      quantity: 0,
      purchasePrice: 0,
      levelBefore: 0,
      levelAfter: 0,
      temperature: undefined,
      deliveryDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedTankId = watch('tankId');
  const quantity = watch('quantity');
  const levelBefore = watch('levelBefore');
  const purchasePrice = watch('purchasePrice');

  const selectedTank = tanks.find((t) => t.id === selectedTankId);

  // Update levelBefore when tank is selected
  useEffect(() => {
    if (selectedTank) {
      setValue('levelBefore', selectedTank.currentLevel);
      setValue('levelAfter', selectedTank.currentLevel + (quantity || 0));
    }
  }, [selectedTank, setValue, quantity]);

  // Update levelAfter when quantity changes
  useEffect(() => {
    if (selectedTank) {
      setValue('levelAfter', levelBefore + (quantity || 0));
    }
  }, [quantity, levelBefore, selectedTank, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDeliveryDto) => deliveryService.create(stationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      navigate('/operations/livraisons');
    },
  });

  const onSubmit = (data: DeliveryFormData) => {
    createMutation.mutate(data);
  };

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const tankOptions = tanks.map((t) => ({
    value: t.id,
    label: `${t.reference} - ${t.fuelType?.name || 'N/A'} (${formatNumber(t.currentLevel)}/${formatNumber(t.capacity)} L)`,
  }));

  const totalAmount = quantity * purchasePrice;
  const levelAfter = levelBefore + quantity;
  const exceedsCapacity = selectedTank && levelAfter > selectedTank.capacity;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/operations/livraisons')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Nouvelle livraison</h1>
          <p className="text-secondary-500">Enregistrer une livraison de carburant</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Fournisseur"
                options={supplierOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.supplierId?.message}
                required
                searchable
              />
            )}
          />
        </div>

        {/* Tank Info */}
        {selectedTank && (
          <div className="p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
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
                <p className="text-secondary-500">Disponible</p>
                <p className="font-semibold">{formatNumber(selectedTank.capacity - selectedTank.currentLevel)} L</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="N° Bon de livraison"
            {...register('deliveryNumber')}
            error={errors.deliveryNumber?.message}
            required
            placeholder="BL-2024-001"
          />
          <FormField
            label="Date de livraison"
            type="date"
            {...register('deliveryDate')}
            error={errors.deliveryDate?.message}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Quantite livree (L)"
            type="number"
            step="0.01"
            {...register('quantity', { valueAsNumber: true })}
            error={errors.quantity?.message}
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
            label="Quantite commandee (L)"
            type="number"
            step="0.01"
            {...register('orderedQuantity', { valueAsNumber: true })}
            error={errors.orderedQuantity?.message}
            hint="Optionnel - pour calcul ecart"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Niveau avant (L)"
            type="number"
            {...register('levelBefore', { valueAsNumber: true })}
            error={errors.levelBefore?.message}
            disabled
          />
          <FormField
            label="Niveau apres (L)"
            type="number"
            {...register('levelAfter', { valueAsNumber: true })}
            error={errors.levelAfter?.message}
            disabled
          />
          <FormField
            label="Temperature (°C)"
            type="number"
            step="0.1"
            {...register('temperature', { valueAsNumber: true })}
            error={errors.temperature?.message}
            hint="Optionnel"
          />
        </div>

        {/* Warning if exceeds capacity */}
        {exceedsCapacity && (
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-danger-700 font-medium">
              Attention : Le niveau apres livraison ({formatNumber(levelAfter)} L) depasse la capacite de la cuve ({formatNumber(selectedTank!.capacity)} L).
            </p>
          </div>
        )}

        {/* Summary */}
        {quantity > 0 && purchasePrice > 0 && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-primary-700 font-medium">Montant total</span>
              <span className="text-2xl font-bold text-primary-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/operations/livraisons')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || !!exceedsCapacity}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Enregistrement...' : 'Enregistrer la livraison'}
          </button>
        </div>
      </form>
    </div>
  );
}
