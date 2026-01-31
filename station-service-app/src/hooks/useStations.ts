import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stationService, CreateStationDto, UpdateStationDto } from '@/services/stationService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const STATIONS_KEY = 'stations';

export function useStations() {
  return useQuery({
    queryKey: [STATIONS_KEY],
    queryFn: () => stationService.getAll(),
  });
}

export function useStation(id: string | undefined) {
  return useQuery({
    queryKey: [STATIONS_KEY, id],
    queryFn: () => stationService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStationDto) => stationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STATIONS_KEY] });
      toast.success('Station créée avec succès');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStationDto }) =>
      stationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [STATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATIONS_KEY, variables.id] });
      toast.success('Station mise à jour');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STATIONS_KEY] });
      toast.success('Station supprimée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
