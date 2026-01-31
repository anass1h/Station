import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService, CreateSaleDto } from '@/services/saleService';
import { salesOperationsService } from '@/services/salesOperationsService';
import { handleApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export const SALES_KEY = 'sales';

// Pompiste hooks - for creating sales during shift
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleDto) => saleService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Vente enregistrée');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useShiftSales(shiftId: string | undefined) {
  return useQuery({
    queryKey: [SALES_KEY, 'shift', shiftId],
    queryFn: () => saleService.getSalesByShift(shiftId!),
    enabled: !!shiftId,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => saleService.getPaymentMethods(),
  });
}

// Gestionnaire hooks - for viewing and managing sales history
export function useSales(
  stationId: string | undefined,
  filters?: {
    startDate?: string;
    endDate?: string;
    pompisteId?: string;
    fuelTypeId?: string;
    paymentMethodId?: string;
    clientId?: string;
  }
) {
  return useQuery({
    queryKey: [SALES_KEY, stationId, filters],
    queryFn: () => salesOperationsService.getSales(stationId!, filters),
    enabled: !!stationId,
  });
}

export function useSaleDetail(id: string | undefined) {
  return useQuery({
    queryKey: [SALES_KEY, 'detail', id],
    queryFn: () => salesOperationsService.getSaleDetail(id!),
    enabled: !!id,
  });
}

export function useSalesStats(stationId: string | undefined, filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [SALES_KEY, 'stats', stationId, filters],
    queryFn: () => salesOperationsService.getSalesStats(stationId!, filters),
    enabled: !!stationId,
  });
}
