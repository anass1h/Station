// Auth
export * from './useAuth';

// Stations
export {
  useStations,
  useStation,
  useCreateStation,
  useUpdateStation,
  useDeleteStation,
  STATIONS_KEY,
} from './useStations';

// Tanks
export {
  useTanks,
  useTank,
  useCreateTank,
  useUpdateTank,
  useDeleteTank,
  TANKS_KEY,
} from './useTanks';

// Shifts
export {
  useCurrentShift,
  useStartShift,
  useEndShift,
  useShifts,
  useShiftDetail,
  useValidateShift,
  SHIFTS_KEY,
} from './useShifts';

// Sales
export {
  useCreateSale,
  useShiftSales,
  usePaymentMethods,
  useSales,
  useSaleDetail,
  useSalesStats,
  SALES_KEY,
} from './useSales';

// Alerts
export {
  useAlerts,
  useAlert,
  useAlertsCount,
  useAcknowledgeAlert,
  useResolveAlert,
  useIgnoreAlert,
  ALERTS_KEY,
} from './useAlerts';

// Debts
export {
  useDebts,
  useDebt,
  useDebtsByPompiste,
  useDebtsOverview,
  useDebtsGrouped,
  useCreateDebt,
  useAddDebtPayment,
  useCancelDebt,
  DEBTS_KEY,
} from './useDebts';

// Dashboard
export {
  useDailySummary,
  useMonthlySummary,
  useStockStatus,
  useActiveShifts,
  useDebtsOverviewDashboard,
  useLowStockAlerts,
  DASHBOARD_KEY,
} from './useDashboard';

// Clients
export {
  useClients,
  useClient,
  useClientPurchases,
  useClientPayments,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  CLIENTS_KEY,
} from './useClients';

// Invoices
export {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useAddInvoicePayment,
  useDeleteInvoice,
  INVOICES_KEY,
} from './useInvoices';
