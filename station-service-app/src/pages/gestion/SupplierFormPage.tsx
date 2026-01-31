import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { supplierService, CreateSupplierDto } from '@/services/supplierService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = !!(id && id !== 'nouveau');

  const stationId = user?.stationId || '';

  const { data: supplier, isLoading: loadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getById(id!),
    enabled: !!isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contactName: supplier.contactName || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
      });
    }
  }, [supplier, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierDto) => supplierService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/gestion/fournisseurs');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateSupplierDto>) => supplierService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      navigate('/gestion/fournisseurs');
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    const cleanData = {
      name: data.name,
      contactName: data.contactName || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate({ ...cleanData, stationId });
    }
  };

  if (isEditing && loadingSupplier) {
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
          onClick={() => navigate('/gestion/fournisseurs')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h1>
          <p className="text-secondary-500">
            {isEditing ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              label="Nom du fournisseur"
              {...register('name')}
              error={errors.name?.message}
              required
            />
          </div>
          <FormField
            label="Nom du contact"
            {...register('contactName')}
            error={errors.contactName?.message}
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/gestion/fournisseurs')}
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
                : 'Creer le fournisseur'}
          </button>
        </div>
      </form>
    </div>
  );
}
