import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { tankService, CreateTankDto } from '@/services/tankService';
import { stationService } from '@/services/stationService';
import { fuelTypeService } from '@/services/fuelTypeService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const tankSchema = z.object({
  stationId: z.string().min(1, 'La station est requise'),
  fuelTypeId: z.string().min(1, 'Le type de carburant est requis'),
  reference: z.string().min(1, 'La reference est requise'),
  capacity: z.number().min(1, 'La capacite doit etre positive'),
  currentLevel: z.number().min(0, 'Le niveau doit etre positif'),
  alertThreshold: z.number().min(1).max(100, 'Le seuil doit etre entre 1 et 100'),
}).refine((data) => data.currentLevel <= data.capacity, {
  message: 'Le niveau ne peut pas depasser la capacite',
  path: ['currentLevel'],
});

type TankFormData = z.infer<typeof tankSchema>;

export function TankFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEditing = !!(id && id !== 'nouveau');

  const { data: tank, isLoading: loadingTank } = useQuery({
    queryKey: ['tank', id],
    queryFn: () => tankService.getById(id!),
    enabled: !!isEditing,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: fuelTypeService.getAll,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TankFormData>({
    resolver: zodResolver(tankSchema),
    defaultValues: {
      stationId: user?.stationId || '',
      fuelTypeId: '',
      reference: '',
      capacity: 0,
      currentLevel: 0,
      alertThreshold: 20,
    },
  });

  const capacity = watch('capacity');

  useEffect(() => {
    if (tank) {
      reset({
        stationId: tank.stationId,
        fuelTypeId: tank.fuelTypeId,
        reference: tank.reference,
        capacity: tank.capacity,
        currentLevel: tank.currentLevel,
        alertThreshold: tank.alertThreshold,
      });
    }
  }, [tank, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTankDto) => tankService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      navigate('/gestion/cuves');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTankDto) => tankService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['tank', id] });
      navigate('/gestion/cuves');
    },
  });

  const onSubmit = (data: TankFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && loadingTank) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stationOptions = stations.map((s) => ({ value: s.id, label: s.name }));
  const fuelTypeOptions = fuelTypes.map((f) => ({ value: f.id, label: f.name }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestion/cuves')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier la cuve' : 'Nouvelle cuve'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations de la cuve' : 'Ajoutez une nouvelle cuve de stockage'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSuperAdmin && (
            <Controller
              name="stationId"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Station"
                  options={stationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.stationId?.message}
                  required
                  disabled={isEditing}
                />
              )}
            />
          )}
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
          <FormField
            label="Reference"
            {...register('reference')}
            error={errors.reference?.message}
            required
            placeholder="Ex: CUVE-001"
          />
          <FormField
            label="Capacite (litres)"
            type="number"
            {...register('capacity', { valueAsNumber: true })}
            error={errors.capacity?.message}
            required
          />
          <FormField
            label="Niveau actuel (litres)"
            type="number"
            {...register('currentLevel', { valueAsNumber: true })}
            error={errors.currentLevel?.message}
            hint={capacity > 0 ? `Maximum: ${capacity.toLocaleString('fr-FR')} L` : undefined}
          />
          <FormField
            label="Seuil d'alerte (%)"
            type="number"
            {...register('alertThreshold', { valueAsNumber: true })}
            error={errors.alertThreshold?.message}
            hint="Pourcentage sous lequel une alerte sera declenchee"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/cuves')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? 'Enregistrement...'
              : isEditing
                ? 'Enregistrer'
                : 'Creer la cuve'}
          </button>
        </div>
      </form>
    </div>
  );
}
