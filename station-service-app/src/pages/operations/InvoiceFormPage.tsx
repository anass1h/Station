import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { invoiceService, CreateInvoiceDto } from '@/services/invoiceService';
import { clientService } from '@/services/clientService';
import { fuelTypeService } from '@/services/fuelTypeService';
import { stationService, Station } from '@/services/stationService';
import { useAuthStore } from '@/stores/authStore';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { formatCurrency } from '@/utils/exportExcel';

const lineSchema = z.object({
  fuelTypeId: z.string().min(1, 'Le type de carburant est requis'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantite positive'),
  unitPriceHT: z.number().positive('Prix positif'),
});

const invoiceSchema = z.object({
  clientId: z.string().optional(),
  type: z.enum(['INTERNAL', 'B2B', 'B2C_TICKET']),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'Au moins une ligne requise'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const preselectedClientId = searchParams.get('clientId') || '';

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', stationId],
    queryFn: () => clientService.getAll(stationId),
    enabled: !!stationId,
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: fuelTypeService.getActive,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: preselectedClientId,
      type: preselectedClientId ? 'B2B' : 'B2C_TICKET',
      periodStart: '',
      periodEnd: '',
      notes: '',
      lines: [{ fuelTypeId: '', description: '', quantity: 0, unitPriceHT: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const lines = watch('lines');

  useEffect(() => {
    if (preselectedClientId) {
      setValue('clientId', preselectedClientId);
      setValue('type', 'B2B');
    }
  }, [preselectedClientId, setValue]);

  const totals = invoiceService.calculateTotals(lines);

  const createMutation = useMutation({
    mutationFn: (data: { dto: CreateInvoiceDto; issue: boolean }) =>
      invoiceService.create(stationId, data.dto, data.issue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/operations/factures');
    },
  });

  const onSubmit = (data: InvoiceFormData, issue: boolean = false) => {
    const dto: CreateInvoiceDto = {
      clientId: data.clientId || undefined,
      invoiceType: data.type,
      periodStart: data.periodStart || undefined,
      periodEnd: data.periodEnd || undefined,
      notes: data.notes || undefined,
      lines: data.lines.map((line) => ({
        fuelTypeId: line.fuelTypeId,
        description: line.description || undefined,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT,
      })),
    };
    createMutation.mutate({ dto, issue });
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.companyName || c.contactName,
  }));

  const fuelTypeOptions = fuelTypes.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  const typeOptions = [
    { value: 'B2B', label: 'B2B (Entreprise)' },
    { value: 'B2C_TICKET', label: 'Ticket (Particulier)' },
    { value: 'INTERNAL', label: 'Interne' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/operations/factures')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Nouvelle facture</h1>
          <p className="text-secondary-500">Creer une facture client</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* General Info */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Informations generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Type de facture"
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.type?.message}
                  required
                />
              )}
            />
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Client"
                  options={[{ value: '', label: 'Aucun (anonyme)' }, ...clientOptions]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.clientId?.message}
                  searchable
                />
              )}
            />
            <FormField
              label="Periode debut"
              type="date"
              {...register('periodStart')}
              error={errors.periodStart?.message}
            />
            <FormField
              label="Periode fin"
              type="date"
              {...register('periodEnd')}
              error={errors.periodEnd?.message}
            />
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Lignes de facture</h2>
            <button
              type="button"
              onClick={() => append({ fuelTypeId: fuelTypes[0]?.id || '', description: '', quantity: 0, unitPriceHT: 0 })}
              className="flex items-center gap-2 px-3 py-1.5 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-sm">Ajouter une ligne</span>
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-secondary-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-2">
                    <Controller
                      name={`lines.${index}.fuelTypeId`}
                      control={control}
                      render={({ field }) => (
                        <SelectField
                          label="Carburant"
                          options={fuelTypeOptions}
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={errors.lines?.[index]?.fuelTypeId?.message}
                          required
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <FormField
                      label="Description"
                      {...register(`lines.${index}.description`)}
                      error={errors.lines?.[index]?.description?.message}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormField
                      label="Quantite"
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                      error={errors.lines?.[index]?.quantity?.message}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormField
                      label="PU HT"
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.unitPriceHT`, { valueAsNumber: true })}
                      error={errors.lines?.[index]?.unitPriceHT?.message}
                      required
                    />
                  </div>
                  <div className="md:col-span-1 text-right">
                    <p className="text-sm text-secondary-500">Total HT</p>
                    <p className="font-semibold">
                      {formatCurrency((lines[index]?.quantity || 0) * (lines[index]?.unitPriceHT || 0))}
                    </p>
                  </div>
                  <div className="md:col-span-1">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.lines?.message && (
            <p className="text-sm text-danger-600 mt-2">{errors.lines.message}</p>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Totaux</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Total HT</p>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totals.totalHT)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">TVA (20%)</p>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totals.tvaAmount)}</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600">Total TTC</p>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(totals.totalTTC)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Notes</h2>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Notes ou commentaires (optionnel)..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/operations/factures')}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
          >
            Enregistrer brouillon
          </button>
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Enregistrement...' : 'Emettre la facture'}
          </button>
        </div>
      </form>
    </div>
  );
}
