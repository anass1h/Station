import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { stationService, CreateStationDto } from '@/services/stationService';
import { FormField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const stationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, 'La ville est requise'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  ice: z.string().optional(),
  iff: z.string().optional(),
  rc: z.string().optional(),
  patente: z.string().optional(),
});

type StationFormData = z.infer<typeof stationSchema>;

export function StationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = !!(id && id !== 'nouveau');

  const { data: station, isLoading: loadingStation } = useQuery({
    queryKey: ['station', id],
    queryFn: () => stationService.getById(id!),
    enabled: !!isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      ice: '',
      iff: '',
      rc: '',
      patente: '',
    },
  });

  useEffect(() => {
    if (station) {
      reset({
        name: station.name,
        address: station.address,
        city: station.city,
        phone: station.phone || '',
        email: station.email || '',
        ice: station.ice || '',
        iff: station.iff || '',
        rc: station.rc || '',
        patente: station.patente || '',
      });
    }
  }, [station, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateStationDto) => stationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      navigate('/gestion/stations');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateStationDto) => stationService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['station', id] });
      navigate('/gestion/stations');
    },
  });

  const onSubmit = (data: StationFormData) => {
    const cleanData: CreateStationDto = {
      name: data.name,
      address: data.address,
      city: data.city,
      phone: data.phone || undefined,
      email: data.email || undefined,
      ice: data.ice || undefined,
      iff: data.iff || undefined,
      rc: data.rc || undefined,
      patente: data.patente || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  if (isEditing && loadingStation) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestion/stations')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier la station' : 'Nouvelle station'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations de la station' : 'Creez une nouvelle station-service'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        {/* Informations principales */}
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Informations principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom de la station"
              {...register('name')}
              error={errors.name?.message}
              required
            />
            <FormField
              label="Ville"
              {...register('city')}
              error={errors.city?.message}
              required
            />
            <div className="md:col-span-2">
              <FormField
                label="Adresse"
                {...register('address')}
                error={errors.address?.message}
                required
              />
            </div>
            <FormField
              label="Telephone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <FormField
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        </div>

        {/* Informations fiscales */}
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Informations fiscales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="ICE"
              {...register('ice')}
              error={errors.ice?.message}
              hint="Identifiant Commun de l'Entreprise"
            />
            <FormField
              label="IF"
              {...register('iff')}
              error={errors.iff?.message}
              hint="Identifiant Fiscal"
            />
            <FormField
              label="RC"
              {...register('rc')}
              error={errors.rc?.message}
              hint="Registre de Commerce"
            />
            <FormField
              label="Patente"
              {...register('patente')}
              error={errors.patente?.message}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/stations')}
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
                : 'Creer la station'}
          </button>
        </div>
      </form>
    </div>
  );
}
