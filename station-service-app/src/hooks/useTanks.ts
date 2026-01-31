import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tankService, Tank, CreateTankDto } from '@/services/tankService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const TANKS_KEY = 'tanks';

export function useTanks(stationId: string | undefined) {
  return useQuery({
    queryKey: [TANKS_KEY, stationId],
    queryFn: () => tankService.getAll(stationId!),
    enabled: !!stationId,
  });
}

export function useTank(id: string | undefined) {
  return useQuery({
    queryKey: [TANKS_KEY, 'detail', id],
    queryFn: () => tankService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTankDto) => tankService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TANKS_KEY] });
      toast.success('Cuve créée avec succès');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateTank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tank> }) =>
      tankService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TANKS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TANKS_KEY, 'detail', variables.id] });
      toast.success('Cuve mise à jour');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteTank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tankService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TANKS_KEY] });
      toast.success('Cuve supprimée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
