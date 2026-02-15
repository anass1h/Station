import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { userService, CreateUserDto } from '@/services/userService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { zText, zOptionalText, LIMITS } from '../../lib/validation';

const pompisteSchema = z.object({
  badgeCode: zText(LIMITS.BADGE_CODE, 'Le code badge est requis'),
  pin: z.string().length(6, 'Le PIN doit contenir 6 chiffres').optional().or(z.literal('')),
  firstName: zText(LIMITS.NAME_STANDARD, 'Le prenom est requis'),
  lastName: zText(LIMITS.NAME_STANDARD, 'Le nom est requis'),
  phone: zOptionalText(LIMITS.PHONE),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type PompisteFormData = z.infer<typeof pompisteSchema>;

export function PompisteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isEditing = !!(id && id !== 'nouveau');

  const [autoGenerateBadge, setAutoGenerateBadge] = useState(!isEditing);
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

  const { data: pompiste, isLoading: loadingPompiste } = useQuery({
    queryKey: ['pompiste', id],
    queryFn: () => userService.getById(id!),
    enabled: !!isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PompisteFormData>({
    resolver: zodResolver(pompisteSchema),
    defaultValues: {
      badgeCode: '',
      pin: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (pompiste) {
      reset({
        badgeCode: pompiste.badgeCode || '',
        pin: '',
        firstName: pompiste.firstName,
        lastName: pompiste.lastName,
        phone: pompiste.phone || '',
        email: pompiste.email || '',
      });
      setAutoGenerateBadge(false);
    }
  }, [pompiste, reset]);

  useEffect(() => {
    if (autoGenerateBadge && !isEditing) {
      setValue('badgeCode', userService.generateBadgeCode());
    }
  }, [autoGenerateBadge, isEditing, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pompistes'] });
      navigate('/gestion/pompistes');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateUserDto>) => userService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pompistes'] });
      queryClient.invalidateQueries({ queryKey: ['pompiste', id] });
      navigate('/gestion/pompistes');
    },
  });

  const onSubmit = (data: PompisteFormData) => {
    if (isEditing) {
      updateMutation.mutate({
        badgeCode: data.badgeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });
    } else {
      createMutation.mutate({
        stationId,
        role: 'POMPISTE',
        badgeCode: data.badgeCode,
        pin: data.pin || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });
    }
  };

  const regenerateBadge = () => {
    setValue('badgeCode', userService.generateBadgeCode());
  };

  if (isEditing && loadingPompiste) {
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
          onClick={() => navigate('/gestion/pompistes')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le pompiste' : 'Nouveau pompiste'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations du pompiste' : 'Ajoutez un nouveau pompiste'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        {/* Badge section */}
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Identification</h2>
          <div className="space-y-4">
            {!isEditing && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoGenerateBadge}
                  onChange={(e) => setAutoGenerateBadge(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Generer le badge automatiquement</span>
              </label>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <FormField
                  label="Code badge"
                  {...register('badgeCode')}
                  error={errors.badgeCode?.message}
                  required
                  disabled={autoGenerateBadge}
                  className="font-mono uppercase"
                />
              </div>
              {autoGenerateBadge && (
                <button
                  type="button"
                  onClick={regenerateBadge}
                  className="self-end p-2.5 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                  title="Regenerer"
                >
                  <ArrowPathIcon className="h-5 w-5 text-secondary-600" />
                </button>
              )}
            </div>
            {!isEditing && (
              <FormField
                label="PIN (6 chiffres)"
                type="password"
                maxLength={6}
                {...register('pin')}
                error={errors.pin?.message}
                placeholder="******"
                hint="Code secret pour la connexion"
              />
            )}
          </div>
        </div>

        {/* Personal info */}
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Informations personnelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Prenom"
              {...register('firstName')}
              error={errors.firstName?.message}
              required
            />
            <FormField
              label="Nom"
              {...register('lastName')}
              error={errors.lastName?.message}
              required
            />
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/pompistes')}
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
                : 'Creer le pompiste'}
          </button>
        </div>
      </form>
    </div>
  );
}
