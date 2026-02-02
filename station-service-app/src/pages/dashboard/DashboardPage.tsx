import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BanknotesIcon,
  BeakerIcon,
  ChartBarIcon,
  BellAlertIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import {
  KpiCard,
  SalesChart,
  TankGaugesGrid,
  ActiveShiftsCard,
  AlertsCard,
  RecentSalesTable,
  TopPompistesCard,
  DebtsOverviewCard,
} from '@/components/dashboard';
import {
  dashboardService,
  DailySummary,
  MonthlySummary,
  StockStatus,
  AlertsOverview,
  DebtsOverview,
  ActiveShift,
  RecentSale,
} from '@/services/dashboardService';
import { stationService, Station } from '@/services/stationService';

type Period = 'today' | '7days' | '30days' | 'month';

const periodOptions: { value: Period; label: string }[] = [
  { value: 'today', label: 'Aujourd\'hui' },
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: 'month', label: 'Mois en cours' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>('today');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string>(user?.stationId || '');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Fetch stations for SUPER_ADMIN
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: stationService.getAll,
    enabled: isSuperAdmin,
  });

  // Auto-select first station for SUPER_ADMIN if none selected
  useEffect(() => {
    if (isSuperAdmin && !selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0].id);
    }
  }, [isSuperAdmin, selectedStationId, stations]);

  const stationId = selectedStationId || user?.stationId || '';

  // Daily summary query
  const { data: dailySummary, isLoading: loadingDaily } = useQuery<DailySummary>({
    queryKey: ['dashboard', 'daily', stationId],
    queryFn: () => dashboardService.getDailySummary(stationId),
    enabled: !!stationId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Monthly summary query
  const { data: monthlySummary, isLoading: loadingMonthly } = useQuery<MonthlySummary>({
    queryKey: ['dashboard', 'monthly', stationId],
    queryFn: () => dashboardService.getMonthlySummary(stationId),
    enabled: !!stationId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Stock status query
  const { data: stockStatus, isLoading: loadingStock } = useQuery<StockStatus>({
    queryKey: ['dashboard', 'stock', stationId],
    queryFn: () => dashboardService.getStockStatus(stationId),
    enabled: !!stationId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Alerts overview query
  const { data: alertsOverview, isLoading: loadingAlerts } = useQuery<AlertsOverview>({
    queryKey: ['dashboard', 'alerts', stationId],
    queryFn: () => dashboardService.getAlertsOverview(stationId),
    enabled: !!stationId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Debts overview query
  const { data: debtsOverview, isLoading: loadingDebts } = useQuery<DebtsOverview>({
    queryKey: ['dashboard', 'debts', stationId],
    queryFn: () => dashboardService.getDebtsOverview(stationId),
    enabled: !!stationId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Active shifts query
  const { data: activeShifts = [], isLoading: loadingShifts } = useQuery<ActiveShift[]>({
    queryKey: ['dashboard', 'shifts', stationId],
    queryFn: () => dashboardService.getActiveShifts(stationId),
    enabled: !!stationId,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // Recent sales query
  const { data: recentSales = [], isLoading: loadingSales } = useQuery<RecentSale[]>({
    queryKey: ['dashboard', 'recentSales', stationId],
    queryFn: () => dashboardService.getRecentSales(stationId, 10),
    enabled: !!stationId,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // Refresh all data
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setShowPeriodDropdown(false);
    if (showPeriodDropdown) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showPeriodDropdown]);

  // Calculate trend percentage
  const calculateTrend = () => {
    if (!monthlySummary?.comparisonPreviousMonth) return undefined;
    return monthlySummary.comparisonPreviousMonth.amountChange;
  };

  const isAnyLoading = loadingDaily || loadingMonthly || loadingStock || loadingAlerts || loadingDebts || loadingShifts || loadingSales;

  // Show message if no station selected
  if (!stationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BuildingStorefrontIcon className="h-16 w-16 text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700 mb-2">
          {isSuperAdmin ? 'Aucune station disponible' : 'Station non configuree'}
        </h2>
        <p className="text-secondary-500 max-w-md">
          {isSuperAdmin
            ? 'Veuillez creer une station pour commencer a utiliser le tableau de bord.'
            : 'Votre compte n\'est associe a aucune station. Contactez l\'administrateur.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Tableau de bord</h1>
          <p className="text-secondary-500">
            {isSuperAdmin && stations.length > 0
              ? `Station: ${stations.find(s => s.id === stationId)?.name || 'Selectionnez une station'}`
              : 'Vue d\'ensemble de votre station'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Station selector for SUPER_ADMIN */}
          {isSuperAdmin && stations.length > 0 && (
            <div className="relative">
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="flex items-center gap-2 px-4 py-2 pr-8 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors text-sm font-medium text-secondary-700 appearance-none cursor-pointer"
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              <BuildingStorefrontIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 pointer-events-none" />
            </div>
          )}

          {/* Period selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPeriodDropdown(!showPeriodDropdown);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <CalendarIcon className="h-5 w-5 text-secondary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {periodOptions.find((p) => p.value === period)?.label}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-secondary-500" />
            </button>

            {showPeriodDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg z-10">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 first:rounded-t-lg last:rounded-b-lg ${
                      period === option.value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isAnyLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isAnyLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'affaires"
          value={`${(dailySummary?.totalSalesAmount || 0).toLocaleString('fr-FR')} MAD`}
          trend={calculateTrend()}
          trendLabel="vs mois dernier"
          icon={BanknotesIcon}
          color="success"
          loading={loadingDaily}
        />
        <KpiCard
          title="Litres vendus"
          value={`${(dailySummary?.totalSalesLiters || 0).toLocaleString('fr-FR')} L`}
          trend={monthlySummary?.comparisonPreviousMonth?.litersChange}
          trendLabel="vs mois dernier"
          icon={BeakerIcon}
          color="primary"
          loading={loadingDaily}
        />
        <KpiCard
          title="Marge estimee"
          value={`${(monthlySummary?.estimatedMargin || 0).toLocaleString('fr-FR')} MAD`}
          icon={ChartBarIcon}
          color="info"
          loading={loadingMonthly}
        />
        <KpiCard
          title="Alertes actives"
          value={`${alertsOverview?.totalActive || 0}`}
          icon={BellAlertIcon}
          color={alertsOverview?.totalActive ? 'warning' : 'success'}
          loading={loadingAlerts}
        />
      </div>

      {/* Sales Chart */}
      <SalesChart
        data={monthlySummary?.dailyEvolution || []}
        loading={loadingMonthly}
      />

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tank Gauges */}
        <TankGaugesGrid
          tanks={stockStatus?.tanks || []}
          loading={loadingStock}
        />

        {/* Active Shifts */}
        <ActiveShiftsCard
          shifts={activeShifts}
          loading={loadingShifts}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <AlertsCard
          alerts={alertsOverview?.recentAlerts || []}
          totalCount={alertsOverview?.totalActive || 0}
          loading={loadingAlerts}
        />

        {/* Top Pompistes */}
        <TopPompistesCard
          pompistes={monthlySummary?.topPompistes || dailySummary?.salesByPompiste || []}
          loading={loadingMonthly || loadingDaily}
        />

        {/* Debts Overview */}
        <DebtsOverviewCard
          totalActiveDebts={debtsOverview?.totalActiveDebts || 0}
          activeDebtsCount={debtsOverview?.activeDebtsCount || 0}
          pompistesWithDebtsCount={debtsOverview?.pompistesWithDebtsCount || 0}
          topDebtors={debtsOverview?.topDebtors || []}
          loading={loadingDebts}
        />
      </div>

      {/* Recent Sales Table */}
      <RecentSalesTable
        sales={recentSales}
        loading={loadingSales}
      />
    </div>
  );
}
