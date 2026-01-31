import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService, AlertPriority, AlertStatus, AlertType } from '@/services/alertService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const ALERTS_KEY = 'alerts';

export function useAlerts(
  stationId: string | undefined,
  filters?: {
    status?: AlertStatus | AlertStatus[];
    priority?: AlertPriority | AlertPriority[];
    type?: AlertType | AlertType[];
  }
) {
  return useQuery({
    queryKey: [ALERTS_KEY, stationId, filters],
    queryFn: () => alertService.getAlerts(stationId!, filters),
    enabled: !!stationId,
    refetchInterval: 30000, // Polling every 30 seconds
  });
}

export function useAlert(id: string | undefined) {
  return useQuery({
    queryKey: [ALERTS_KEY, 'detail', id],
    queryFn: () => alertService.getAlert(id!),
    enabled: !!id,
  });
}

export function useAlertsCount(stationId: string | undefined) {
  return useQuery({
    queryKey: [ALERTS_KEY, 'count', stationId],
    queryFn: () => alertService.getAlertsCount(stationId!),
    enabled: !!stationId,
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertService.acknowledgeAlert(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY, 'detail', id] });
      toast.success('Alerte prise en charge');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution?: string }) =>
      alertService.resolveAlert(id, resolution),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY, 'detail', variables.id] });
      toast.success('Alerte résolue');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useIgnoreAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      alertService.ignoreAlert(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ALERTS_KEY, 'detail', variables.id] });
      toast.success('Alerte ignorée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
