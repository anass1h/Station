import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export const DASHBOARD_KEY = 'dashboard';

export function useDailySummary(stationId: string | undefined, date?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'daily', stationId, date],
    queryFn: () => dashboardService.getDailySummary(stationId!, date),
    enabled: !!stationId,
    staleTime: 60000, // 1 minute
  });
}

export function useMonthlySummary(stationId: string | undefined, year?: number, month?: number) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'monthly', stationId, year, month],
    queryFn: () => dashboardService.getMonthlySummary(stationId!, year, month),
    enabled: !!stationId,
    staleTime: 300000, // 5 minutes
  });
}

export function useStockStatus(stationId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'stock', stationId],
    queryFn: () => dashboardService.getStockStatus(stationId!),
    enabled: !!stationId,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useActiveShifts(stationId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'activeShifts', stationId],
    queryFn: () => dashboardService.getActiveShifts(stationId!),
    enabled: !!stationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useDebtsOverviewDashboard(stationId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'debts', stationId],
    queryFn: () => dashboardService.getDebtsOverview(stationId!),
    enabled: !!stationId,
    staleTime: 300000, // 5 minutes
  });
}

export function useLowStockAlerts(stationId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'lowStock', stationId],
    queryFn: () => dashboardService.getLowStockAlerts(stationId!),
    enabled: !!stationId,
    refetchInterval: 60000, // Refresh every minute
  });
}
