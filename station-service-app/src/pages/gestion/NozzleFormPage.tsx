import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { nozzleService } from '@/services/nozzleService';
import { dispenserService } from '@/services/dispenserService';
import { tankService } from '@/services/tankService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const nozzleSchema = z.object({
  dispenserId: z.string().min(1, 'Le distributeur est requis'),
  tankId: z.string().min(1, 'La cuve est requise'),
  reference: z.string().min(1, 'La reference est requise'),
  position: z.number().min(1, 'La position doit etre positive'),
  currentIndex: z.number().min(0, "L'index doit etre positif ou nul"),
});

type NozzleFormData = z.infer<typeof nozzleSchema>;

export function NozzleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEditing = !!(id && id !== 'nouveau');
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

  const { data: nozzle, isLoading: loadingNozzle } = useQuery({
    queryKey: ['nozzle', id],
    queryFn: () => nozzleService.getById(id!),
    enabled: !!isEditing,
  });

  const { data: dispensers = [] } = useQuery({
    queryKey: ['dispensers', stationId],
    queryFn: () => dispenserService.getByStation(stationId),
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NozzleFormData>({
    resolver: zodResolver(nozzleSchema),
    defaultValues: {
      dispenserId: '',
      tankId: '',
      reference: '',
      position: 1,
      currentIndex: 0,
    },
  });

  useEffect(() => {
    if (nozzle) {
      reset({
        dispenserId: nozzle.dispenserId,
        tankId: nozzle.tankId,
        reference: nozzle.reference,
        position: nozzle.position,
        currentIndex: nozzle.currentIndex,
      });
    }
  }, [nozzle, reset]);

  const createMutation = useMutation({
    mutationFn: (data: NozzleFormData) => nozzleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzles'] });
      navigate('/gestion/pistolets');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NozzleFormData>) => nozzleService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzles'] });
      queryClient.invalidateQueries({ queryKey: ['nozzle', id] });
      navigate('/gestion/pistolets');
    },
  });

  const onSubmit = (data: NozzleFormData) => {
    if (isEditing) {
      updateMutation.mutate({
        tankId: data.tankId,
        reference: data.reference,
        position: data.position,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && loadingNozzle) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dispenserOptions = dispensers.map((d) => ({ value: d.id, label: d.reference }));
  const tankOptions = tanks.map((t) => ({
    value: t.id,
    label: `${t.reference} - ${t.fuelType?.name || 'N/A'}`,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestion/pistolets')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le pistolet' : 'Nouveau pistolet'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations du pistolet' : 'Ajoutez un nouveau pistolet'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="dispenserId"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Distributeur"
                options={dispenserOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.dispenserId?.message}
                required
                disabled={isEditing}
              />
            )}
          />
          <Controller
            name="tankId"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Cuve (carburant)"
                options={tankOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.tankId?.message}
                required
              />
            )}
          />
          <FormField
            label="Reference"
            {...register('reference')}
            error={errors.reference?.message}
            required
            placeholder="Ex: PIST-001"
          />
          <FormField
            label="Position"
            type="number"
            {...register('position', { valueAsNumber: true })}
            error={errors.position?.message}
            required
            hint="Position sur le distributeur (1, 2, 3...)"
          />
          {!isEditing && (
            <FormField
              label="Index initial (litres)"
              type="number"
              {...register('currentIndex', { valueAsNumber: true })}
              error={errors.currentIndex?.message}
              hint="Index du compteur au moment de l'installation"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/pistolets')}
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
                : 'Creer le pistolet'}
          </button>
        </div>
      </form>
    </div>
  );
}
