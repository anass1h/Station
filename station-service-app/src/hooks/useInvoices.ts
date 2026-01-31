import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, CreateInvoiceDto, AddPaymentDto, InvoiceStatus, InvoiceType } from '@/services/invoiceService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const INVOICES_KEY = 'invoices';

export function useInvoices(
  stationId: string | undefined,
  filters?: {
    status?: InvoiceStatus;
    clientId?: string;
    type?: InvoiceType;
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: [INVOICES_KEY, stationId, filters],
    queryFn: () => invoiceService.getAll(stationId!, filters),
    enabled: !!stationId,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [INVOICES_KEY, 'detail', id],
    queryFn: () => invoiceService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, data }: { stationId: string; data: CreateInvoiceDto & { issue?: boolean } }) =>
      invoiceService.create(stationId, data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success(invoice.status === 'ISSUED' ? 'Facture émise' : 'Brouillon créé');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceDto> }) =>
      invoiceService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY, 'detail', variables.id] });
      toast.success('Facture mise à jour');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.issue(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY, 'detail', id] });
      toast.success('Facture émise');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoiceService.cancel(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY, 'detail', variables.id] });
      toast.success('Facture annulée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAddInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: AddPaymentDto }) =>
      invoiceService.addPayment(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY, 'detail', variables.invoiceId] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success('Facture supprimée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
