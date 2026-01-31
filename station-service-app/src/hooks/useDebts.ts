import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtService, CreateDebtDto, AddPaymentDto, DebtStatus, DebtReason } from '@/services/debtService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const DEBTS_KEY = 'debts';

export function useDebts(
  stationId: string | undefined,
  filters?: {
    pompisteId?: string;
    status?: DebtStatus;
    reason?: DebtReason;
  }
) {
  return useQuery({
    queryKey: [DEBTS_KEY, stationId, filters],
    queryFn: () => debtService.getDebts(stationId!, filters),
    enabled: !!stationId,
  });
}

export function useDebt(id: string | undefined) {
  return useQuery({
    queryKey: [DEBTS_KEY, 'detail', id],
    queryFn: () => debtService.getDebt(id!),
    enabled: !!id,
  });
}

export function useDebtsByPompiste(pompisteId: string | undefined) {
  return useQuery({
    queryKey: [DEBTS_KEY, 'pompiste', pompisteId],
    queryFn: () => debtService.getDebtsByPompiste(pompisteId!),
    enabled: !!pompisteId,
  });
}

export function useDebtsOverview(stationId: string | undefined) {
  return useQuery({
    queryKey: [DEBTS_KEY, 'overview', stationId],
    queryFn: () => debtService.getDebtsOverview(stationId!),
    enabled: !!stationId,
  });
}

export function useDebtsGrouped(stationId: string | undefined) {
  return useQuery({
    queryKey: [DEBTS_KEY, 'grouped', stationId],
    queryFn: () => debtService.getDebtsGroupedByPompiste(stationId!),
    enabled: !!stationId,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, data }: { stationId: string; data: CreateDebtDto }) =>
      debtService.createDebt(stationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEBTS_KEY] });
      toast.success('Dette enregistrée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAddDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: AddPaymentDto }) =>
      debtService.addPayment(debtId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DEBTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBTS_KEY, 'detail', variables.debtId] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useCancelDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId, reason }: { debtId: string; reason?: string }) =>
      debtService.cancelDebt(debtId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DEBTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBTS_KEY, 'detail', variables.debtId] });
      toast.success('Dette annulée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
