import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { zText, LIMITS } from '../../lib/validation';
import { dispenserService, CreateDispenserDto } from '@/services/dispenserService';
import { stationService } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const dispenserSchema = z.object({
  stationId: z.string().min(1, 'La station est requise'),
  reference: zText(LIMITS.REFERENCE_SHORT, 'La reference est requise'),
});

type DispenserFormData = z.infer<typeof dispenserSchema>;

export function DispenserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEditing = !!(id && id !== 'nouveau');

  const { data: dispenser, isLoading: loadingDispenser } = useQuery({
    queryKey: ['dispenser', id],
    queryFn: () => dispenserService.getById(id!),
    enabled: !!isEditing,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DispenserFormData>({
    resolver: zodResolver(dispenserSchema),
    defaultValues: {
      stationId: user?.stationId || '',
      reference: '',
    },
  });

  useEffect(() => {
    if (dispenser) {
      reset({
        stationId: dispenser.stationId,
        reference: dispenser.reference,
      });
    }
  }, [dispenser, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDispenserDto) => dispenserService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispensers'] });
      navigate('/gestion/distributeurs');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { reference: string }) => dispenserService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispensers'] });
      queryClient.invalidateQueries({ queryKey: ['dispenser', id] });
      navigate('/gestion/distributeurs');
    },
  });

  const onSubmit = (data: DispenserFormData) => {
    if (isEditing) {
      updateMutation.mutate({ reference: data.reference });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && loadingDispenser) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stationOptions = stations.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestion/distributeurs')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le distributeur' : 'Nouveau distributeur'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations du distributeur' : 'Ajoutez un nouveau distributeur'}
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
          <FormField
            label="Reference"
            {...register('reference')}
            error={errors.reference?.message}
            required
            placeholder="Ex: DIST-001"
          />
        </div>

        {/* Nozzles info for existing dispenser */}
        {isEditing && dispenser?.nozzles && dispenser.nozzles.length > 0 && (
          <div className="border-t border-secondary-200 pt-4">
            <h3 className="text-sm font-medium text-secondary-700 mb-2">Pistolets associes</h3>
            <div className="flex flex-wrap gap-2">
              {dispenser.nozzles.map((nozzle) => (
                <span
                  key={nozzle.id}
                  className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                >
                  {nozzle.reference} (Position {nozzle.position})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/distributeurs')}
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
                : 'Creer le distributeur'}
          </button>
        </div>
      </form>
    </div>
  );
}
