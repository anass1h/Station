import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService, StartShiftDto, EndShiftDto } from '@/services/shiftService';
import { shiftOperationsService, ShiftStatus } from '@/services/shiftOperationsService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const SHIFTS_KEY = 'shifts';

// Pompiste hooks
export function useCurrentShift() {
  return useQuery({
    queryKey: [SHIFTS_KEY, 'current'],
    queryFn: () => shiftService.getCurrentShift(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartShiftDto) => shiftService.startShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] });
      toast.success('Shift démarré');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useEndShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: EndShiftDto }) =>
      shiftService.endShift(shiftId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] });
      toast.success('Shift clôturé');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// Gestionnaire hooks
export function useShifts(
  stationId: string | undefined,
  filters?: {
    startDate?: string;
    endDate?: string;
    pompisteId?: string;
    status?: ShiftStatus;
  }
) {
  return useQuery({
    queryKey: [SHIFTS_KEY, stationId, filters],
    queryFn: () => shiftOperationsService.getShifts(stationId!, filters),
    enabled: !!stationId,
  });
}

export function useShiftDetail(id: string | undefined) {
  return useQuery({
    queryKey: [SHIFTS_KEY, 'detail', id],
    queryFn: () => shiftOperationsService.getShiftDetail(id!),
    enabled: !!id,
  });
}

export function useValidateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shiftOperationsService.validateShift(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY, 'detail', id] });
      toast.success('Shift validé');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
