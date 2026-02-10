import { LicencePlan } from '@prisma/client';

export interface PlanFeatures {
  shifts: boolean;
  fuelSales: boolean;
  cashPayments: boolean;
  cardPayments: boolean;
  fuelVouchers: boolean;
  dashboardBasic: boolean;
  dashboardAdvanced: boolean;
  dashboardGlobal: boolean;
  invoicingB2C: boolean;
  invoicingB2B: boolean;
  creditNotes: boolean;
  creditClients: boolean;
  reportsBasic: boolean;
  reportsPdf: boolean;
  reportsExcel: boolean;
  reportsBi: boolean;
  lowStockAlerts: boolean;
  maintenancePreventive: boolean;
  multiStation: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  offlineMode: boolean;
  dgiCompliance: boolean;
}

export interface LicencePlanConfig {
  name: string;
  description: string;
  maxUsers: number;
  maxDispensers: number;
  maxTanks: number;
  maxStations: number;
  gracePeriodDays: number;
  features: PlanFeatures;
  color: string;
}

// ═══════════════════════════════════════════════════════
// PLAN UNIQUE BETA — PHASE TEST
// Tout déverrouillé, aucune limitation.
// ═══════════════════════════════════════════════════════
export const LICENCE_PLANS: Record<LicencePlan, LicencePlanConfig> = {
  BETA: {
    name: 'Beta',
    description: 'Phase test — toutes fonctionnalités, aucune limitation',
    maxUsers: 99,
    maxDispensers: 99,
    maxTanks: 99,
    maxStations: 10,
    gracePeriodDays: 30,
    features: {
      shifts: true,
      fuelSales: true,
      cashPayments: true,
      cardPayments: true,
      fuelVouchers: true,
      dashboardBasic: true,
      dashboardAdvanced: true,
      dashboardGlobal: true,
      invoicingB2C: true,
      invoicingB2B: true,
      creditNotes: true,
      creditClients: true,
      reportsBasic: true,
      reportsPdf: true,
      reportsExcel: true,
      reportsBi: true,
      lowStockAlerts: true,
      maintenancePreventive: true,
      multiStation: true,
      apiAccess: true,
      webhooks: true,
      offlineMode: true,
      dgiCompliance: true,
    },
    color: '#10B981',
  },
} as const;

export function getPlanConfig(plan: LicencePlan): LicencePlanConfig {
  return LICENCE_PLANS[plan];
}

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  shifts: 'Gestion des shifts',
  fuelSales: 'Ventes carburant',
  cashPayments: 'Encaissements espèces',
  cardPayments: 'Encaissements CB',
  fuelVouchers: 'Bons carburant',
  dashboardBasic: 'Tableau de bord basique',
  dashboardAdvanced: 'Tableau de bord avancé',
  dashboardGlobal: 'Dashboard global multi-stations',
  invoicingB2C: 'Facturation B2C',
  invoicingB2B: 'Facturation B2B',
  creditNotes: 'Avoirs & annulations',
  creditClients: 'Gestion clients crédit',
  reportsBasic: 'Rapports de base',
  reportsPdf: 'Export PDF',
  reportsExcel: 'Export Excel',
  reportsBi: 'Analytics avancés / BI',
  lowStockAlerts: 'Alertes stock bas',
  maintenancePreventive: 'Maintenance préventive',
  multiStation: 'Multi-station',
  apiAccess: 'API REST',
  webhooks: 'Webhooks',
  offlineMode: 'Mode offline',
  dgiCompliance: 'Conformité DGI Maroc',
};
