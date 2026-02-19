import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { clientService, CreateClientDto } from '@/services/clientService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { zText, zOptionalText, LIMITS } from '../../lib/validation';

const clientSchema = z.object({
  type: z.enum(['B2B', 'B2C_REGISTERED']),
  companyName: zOptionalText(LIMITS.NAME_LONG),
  contactName: zText(LIMITS.NAME_STANDARD, 'Le nom du contact est requis'),
  phone: zOptionalText(LIMITS.PHONE),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: zOptionalText(LIMITS.ADDRESS),
  ice: zOptionalText(LIMITS.REFERENCE_SHORT),
  iff: zOptionalText(LIMITS.REFERENCE_SHORT),
  rc: zOptionalText(LIMITS.REFERENCE_SHORT),
  creditLimit: z.number().min(0, 'Le plafond doit etre positif ou nul'),
  paymentTermDays: z.number().min(0, 'Le delai doit etre positif ou nul'),
}).refine((data) => {
  if (data.type === 'B2B' && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: 'La raison sociale est requise pour les clients B2B',
  path: ['companyName'],
});

type ClientFormData = z.infer<typeof clientSchema>;

export function ClientFormPage() {
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

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: isEditing,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: 'B2B',
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      ice: '',
      iff: '',
      rc: '',
      creditLimit: 0,
      paymentTermDays: 30,
    },
  });

  const clientType = watch('type');

  useEffect(() => {
    if (client) {
      reset({
        type: client.type,
        companyName: client.companyName || '',
        contactName: client.contactName,
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        ice: client.ice || '',
        iff: client.iff || '',
        rc: client.rc || '',
        creditLimit: client.creditLimit,
        paymentTermDays: client.paymentTermDays,
      });
    }
  }, [client, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateClientDto) => clientService.create(stationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/operations/clients');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateClientDto>) => clientService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      navigate(`/operations/clients/${id}`);
    },
  });

  const onSubmit = (data: ClientFormData) => {
    const cleanData: CreateClientDto = {
      type: data.type,
      companyName: data.type === 'B2B' ? data.companyName : undefined,
      contactName: data.contactName,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      ice: data.type === 'B2B' ? data.ice || undefined : undefined,
      iff: data.type === 'B2B' ? data.iff || undefined : undefined,
      rc: data.type === 'B2B' ? data.rc || undefined : undefined,
      creditLimit: data.creditLimit,
      paymentTermDays: data.paymentTermDays,
    };

    if (isEditing) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  if (isEditing && loadingClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const typeOptions = [
    { value: 'B2B', label: 'Entreprise (B2B)' },
    { value: 'B2C_REGISTERED', label: 'Particulier enregistre' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/operations/clients')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le client' : 'Nouveau client'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Type de client"
              options={typeOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.type?.message}
              required
              disabled={isEditing}
            />
          )}
        />

        {clientType === 'B2B' && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg space-y-4">
            <h3 className="font-medium text-primary-900">Informations entreprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField
                  label="Raison sociale"
                  {...register('companyName')}
                  error={errors.companyName?.message}
                  required
                />
              </div>
              <FormField
                label="ICE"
                {...register('ice')}
                error={errors.ice?.message}
              />
              <FormField
                label="IF"
                {...register('iff')}
                error={errors.iff?.message}
              />
              <FormField
                label="RC"
                {...register('rc')}
                error={errors.rc?.message}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Nom du contact"
            {...register('contactName')}
            error={errors.contactName?.message}
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
          <div className="md:col-span-2">
            <FormField
              label="Adresse"
              {...register('address')}
              error={errors.address?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Plafond de credit (MAD)"
            type="number"
            {...register('creditLimit', { valueAsNumber: true })}
            error={errors.creditLimit?.message}
            hint="0 = pas de credit"
          />
          <FormField
            label="Delai de paiement (jours)"
            type="number"
            {...register('paymentTermDays', { valueAsNumber: true })}
            error={errors.paymentTermDays?.message}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/operations/clients')}
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
                : 'Creer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}
