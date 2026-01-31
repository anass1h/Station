import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, CreateClientDto, ClientType } from '@/services/clientService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const CLIENTS_KEY = 'clients';

export function useClients(
  stationId: string | undefined,
  filters?: {
    type?: ClientType;
    isActive?: boolean;
  }
) {
  return useQuery({
    queryKey: [CLIENTS_KEY, stationId, filters],
    queryFn: () => clientService.getAll(stationId!, filters),
    enabled: !!stationId,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: [CLIENTS_KEY, 'detail', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  });
}

export function useClientPurchases(clientId: string | undefined) {
  return useQuery({
    queryKey: [CLIENTS_KEY, 'purchases', clientId],
    queryFn: () => clientService.getPurchaseHistory(clientId!),
    enabled: !!clientId,
  });
}

export function useClientPayments(clientId: string | undefined) {
  return useQuery({
    queryKey: [CLIENTS_KEY, 'payments', clientId],
    queryFn: () => clientService.getPaymentHistory(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, data }: { stationId: string; data: CreateClientDto }) =>
      clientService.create(stationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
      toast.success('Client créé avec succès');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientDto> }) =>
      clientService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY, 'detail', variables.id] });
      toast.success('Client mis à jour');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
      toast.success('Client supprimé');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
