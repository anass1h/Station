import { Injectable } from '@nestjs/common';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import {
  DailySummary,
  DailyEvolution,
  MonthlySummary,
  StockStatus,
  TankStatus,
  PompistePerformance,
  FinancialSummary,
  AlertsOverview,
  GlobalSummary,
  FuelTypeSales,
  PompisteSales,
} from './types.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(stationId: string, date: Date): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all sales for the day
    const sales = await this.prisma.sale.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: { stationId },
          },
        },
        soldAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        fuelType: true,
        shift: {
          include: {
            pompiste: true,
          },
        },
      },
    });

    // Calculate totals
    const totalSalesLiters = sales.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );
    const totalSalesAmount = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    // Group by fuel type
    const fuelTypeMap = new Map<string, FuelTypeSales>();
    for (const sale of sales) {
      const key = sale.fuelTypeId;
      const existing = fuelTypeMap.get(key) || {
        fuelType: sale.fuelType.name,
        fuelTypeId: sale.fuelTypeId,
        liters: 0,
        amount: 0,
      };
      existing.liters += Number(sale.quantity);
      existing.amount += Number(sale.totalAmount);
      fuelTypeMap.set(key, existing);
    }

    // Group by pompiste
    const pompisteMap = new Map<string, PompisteSales>();
    for (const sale of sales) {
      const key = sale.shift.pompisteId;
      const pompiste = sale.shift.pompiste;
      const existing = pompisteMap.get(key) || {
        pompisteId: key,
        pompiste: `${pompiste.firstName} ${pompiste.lastName}`,
        liters: 0,
        amount: 0,
      };
      existing.liters += Number(sale.quantity);
      existing.amount += Number(sale.totalAmount);
      pompisteMap.set(key, existing);
    }

    // Count shifts
    const shifts = await this.prisma.shift.findMany({
      where: {
        nozzle: {
          dispenser: { stationId },
        },
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        cashRegister: true,
      },
    });

    // Calculate average cash variance
    const cashRegisters = shifts
      .map((s) => s.cashRegister)
      .filter((cr): cr is NonNullable<typeof cr> => cr !== null);

    const avgCashVariance =
      cashRegisters.length > 0
        ? cashRegisters.reduce((sum, cr) => sum + Number(cr.variance), 0) /
          cashRegisters.length
        : 0;

    return {
      date: date.toISOString().split('T')[0],
      totalSalesLiters: Math.round(totalSalesLiters * 100) / 100,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      salesByFuelType: Array.from(fuelTypeMap.values()),
      salesByPompiste: Array.from(pompisteMap.values()),
      shiftsCount: shifts.length,
      avgCashVariance: Math.round(avgCashVariance * 100) / 100,
    };
  }

  async getMonthlySummary(
    stationId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummary> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all sales for the month
    const sales = await this.prisma.sale.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: { stationId },
          },
        },
        soldAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        shift: {
          include: {
            pompiste: true,
          },
        },
      },
    });

    const totalSalesLiters = sales.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );
    const totalSalesAmount = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    // Get deliveries for purchases
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        tank: { stationId },
        deliveredAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalPurchaseAmount = deliveries.reduce(
      (sum, d) => sum + Number(d.quantity) * Number(d.purchasePrice),
      0,
    );

    // Estimate margin (simplified: sales - purchases for the period)
    const estimatedMargin = totalSalesAmount - totalPurchaseAmount;

    // Daily evolution
    const dailyMap = new Map<string, DailyEvolution>();
    for (const sale of sales) {
      const dateKey = sale.soldAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        liters: 0,
        amount: 0,
      };
      existing.liters += Number(sale.quantity);
      existing.amount += Number(sale.totalAmount);
      dailyMap.set(dateKey, existing);
    }
    const dailyEvolution = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Previous month comparison
    const prevStartOfMonth = new Date(year, month - 2, 1);
    const prevEndOfMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const prevSales = await this.prisma.sale.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: { stationId },
          },
        },
        soldAt: {
          gte: prevStartOfMonth,
          lte: prevEndOfMonth,
        },
      },
    });

    const prevTotalLiters = prevSales.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );
    const prevTotalAmount = prevSales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    const litersChange =
      prevTotalLiters > 0
        ? ((totalSalesLiters - prevTotalLiters) / prevTotalLiters) * 100
        : 0;
    const amountChange =
      prevTotalAmount > 0
        ? ((totalSalesAmount - prevTotalAmount) / prevTotalAmount) * 100
        : 0;

    // Top pompistes
    const pompisteMap = new Map<string, PompisteSales>();
    for (const sale of sales) {
      const key = sale.shift.pompisteId;
      const pompiste = sale.shift.pompiste;
      const existing = pompisteMap.get(key) || {
        pompisteId: key,
        pompiste: `${pompiste.firstName} ${pompiste.lastName}`,
        liters: 0,
        amount: 0,
      };
      existing.liters += Number(sale.quantity);
      existing.amount += Number(sale.totalAmount);
      pompisteMap.set(key, existing);
    }

    const topPompistes = Array.from(pompisteMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      year,
      month,
      totalSalesLiters: Math.round(totalSalesLiters * 100) / 100,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
      estimatedMargin: Math.round(estimatedMargin * 100) / 100,
      dailyEvolution,
      comparisonPreviousMonth: {
        litersChange: Math.round(litersChange * 100) / 100,
        amountChange: Math.round(amountChange * 100) / 100,
      },
      topPompistes,
    };
  }

  async getStockStatus(stationId: string): Promise<StockStatus> {
    const tanks = await this.prisma.tank.findMany({
      where: { stationId, isActive: true },
      include: {
        fuelType: true,
      },
    });

    // Get average daily consumption per tank (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tankStatuses: TankStatus[] = await Promise.all(
      tanks.map(async (tank) => {
        const currentLevel = Number(tank.currentLevel);
        const capacity = Number(tank.capacity);
        const lowThreshold = Number(tank.lowThreshold);
        const percentage = (currentLevel / capacity) * 100;

        // Calculate average daily consumption
        const sales = await this.prisma.sale.findMany({
          where: {
            fuelTypeId: tank.fuelTypeId,
            shift: {
              nozzle: {
                tankId: tank.id,
              },
            },
            soldAt: { gte: thirtyDaysAgo },
          },
        });

        const totalSold = sales.reduce((sum, s) => sum + Number(s.quantity), 0);
        const avgDailyConsumption = totalSold / 30;
        const daysRemaining =
          avgDailyConsumption > 0
            ? Math.floor(currentLevel / avgDailyConsumption)
            : null;

        return {
          tankId: tank.id,
          reference: tank.reference,
          fuelType: tank.fuelType.name,
          fuelTypeId: tank.fuelTypeId,
          currentLevel: Math.round(currentLevel * 100) / 100,
          capacity: Math.round(capacity * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          lowThreshold: Math.round(lowThreshold * 100) / 100,
          isLow: currentLevel <= lowThreshold,
          daysRemaining,
        };
      }),
    );

    const totalCapacity = tankStatuses.reduce((sum, t) => sum + t.capacity, 0);
    const totalCurrentLevel = tankStatuses.reduce(
      (sum, t) => sum + t.currentLevel,
      0,
    );

    // Count active stock alerts
    const alertsCount = await this.prisma.alert.count({
      where: {
        stationId,
        alertType: AlertType.LOW_STOCK,
        status: AlertStatus.ACTIVE,
      },
    });

    return {
      tanks: tankStatuses,
      totalCapacity: Math.round(totalCapacity * 100) / 100,
      totalCurrentLevel: Math.round(totalCurrentLevel * 100) / 100,
      alertsCount,
    };
  }

  async getPompistePerformance(
    pompisteId: string,
    from: Date,
    to: Date,
  ): Promise<PompistePerformance> {
    const pompiste = await this.prisma.user.findUnique({
      where: { id: pompisteId },
    });

    const shifts = await this.prisma.shift.findMany({
      where: {
        pompisteId,
        startedAt: { gte: from },
        endedAt: { lte: to },
      },
      include: {
        sales: true,
        cashRegister: true,
      },
    });

    const totalShifts = shifts.length;

    // Calculate total hours worked
    const totalHoursWorked = shifts.reduce((sum, shift) => {
      if (shift.endedAt) {
        const hours =
          (shift.endedAt.getTime() - shift.startedAt.getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    // Calculate sales totals
    const allSales = shifts.flatMap((s) => s.sales);
    const totalSalesLiters = allSales.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );
    const totalSalesAmount = allSales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    const avgSalesPerShift =
      totalShifts > 0 ? totalSalesAmount / totalShifts : 0;

    // Calculate average cash variance
    const cashRegisters = shifts
      .map((s) => s.cashRegister)
      .filter((cr): cr is NonNullable<typeof cr> => cr !== null);

    const avgCashVariance =
      cashRegisters.length > 0
        ? cashRegisters.reduce((sum, cr) => sum + Number(cr.variance), 0) /
          cashRegisters.length
        : 0;

    // Count incidents (shifts with incident notes)
    const incidentsCount = shifts.filter(
      (s) => s.incidentNote && s.incidentNote.trim() !== '',
    ).length;

    return {
      pompisteId,
      pompisteName: pompiste
        ? `${pompiste.firstName} ${pompiste.lastName}`
        : 'Unknown',
      totalShifts,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      totalSalesLiters: Math.round(totalSalesLiters * 100) / 100,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      avgSalesPerShift: Math.round(avgSalesPerShift * 100) / 100,
      avgCashVariance: Math.round(avgCashVariance * 100) / 100,
      incidentsCount,
    };
  }

  async getFinancialSummary(
    stationId: string,
    year: number,
    month: number,
  ): Promise<FinancialSummary> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get invoices for the month
    const invoices = await this.prisma.invoice.findMany({
      where: {
        stationId,
        issuedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { not: 'CANCELLED' },
      },
    });

    const revenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.amountTTC),
      0,
    );
    const revenueHT = invoices.reduce(
      (sum, inv) => sum + Number(inv.amountHT),
      0,
    );
    const vatCollected = invoices.reduce(
      (sum, inv) => sum + Number(inv.vatAmount),
      0,
    );

    // Get deliveries for purchases
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        tank: { stationId },
        deliveredAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const purchases = deliveries.reduce(
      (sum, d) => sum + Number(d.quantity) * Number(d.purchasePrice),
      0,
    );

    const estimatedMargin = revenueHT - purchases;

    // Unpaid invoices (total)
    const unpaidInvoicesData = await this.prisma.invoice.findMany({
      where: {
        stationId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      },
    });

    const unpaidInvoices = unpaidInvoicesData.reduce(
      (sum, inv) => sum + (Number(inv.amountTTC) - Number(inv.paidAmount)),
      0,
    );

    // Overdue invoices
    const today = new Date();
    const overdueInvoicesData = await this.prisma.invoice.findMany({
      where: {
        stationId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        dueDate: { lt: today },
      },
    });

    const overdueInvoices = overdueInvoicesData.reduce(
      (sum, inv) => sum + (Number(inv.amountTTC) - Number(inv.paidAmount)),
      0,
    );

    return {
      year,
      month,
      revenue: Math.round(revenue * 100) / 100,
      revenueHT: Math.round(revenueHT * 100) / 100,
      vatCollected: Math.round(vatCollected * 100) / 100,
      purchases: Math.round(purchases * 100) / 100,
      estimatedMargin: Math.round(estimatedMargin * 100) / 100,
      unpaidInvoices: Math.round(unpaidInvoices * 100) / 100,
      overdueInvoices: Math.round(overdueInvoices * 100) / 100,
    };
  }

  async getAlertsOverview(stationId: string): Promise<AlertsOverview> {
    const activeAlerts = await this.prisma.alert.findMany({
      where: {
        stationId,
        status: AlertStatus.ACTIVE,
      },
      orderBy: { triggeredAt: 'desc' },
    });

    const totalActive = activeAlerts.length;

    // Group by priority
    const byPriority = {
      critical: activeAlerts.filter(
        (a) => a.priority === AlertPriority.CRITICAL,
      ).length,
      high: activeAlerts.filter((a) => a.priority === AlertPriority.HIGH)
        .length,
      medium: activeAlerts.filter((a) => a.priority === AlertPriority.MEDIUM)
        .length,
      low: activeAlerts.filter((a) => a.priority === AlertPriority.LOW).length,
    };

    // Group by type
    const byType: Record<string, number> = {};
    for (const alert of activeAlerts) {
      byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
    }

    // Recent alerts (top 5)
    const recentAlerts = activeAlerts.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      type: a.alertType,
      triggeredAt: a.triggeredAt,
    }));

    return {
      totalActive,
      byPriority,
      byType,
      recentAlerts,
    };
  }

  async getGlobalSummary(year: number, month: number): Promise<GlobalSummary> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const stations = await this.prisma.station.findMany({
      where: { isActive: true },
    });

    const stationsCount = stations.length;

    // Get all sales across all stations
    const sales = await this.prisma.sale.findMany({
      where: {
        soldAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        shift: {
          include: {
            nozzle: {
              include: {
                dispenser: {
                  include: { station: true },
                },
              },
            },
          },
        },
      },
    });

    const totalSalesLiters = sales.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );
    const totalSalesAmount = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    // Get all deliveries
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        deliveredAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalPurchaseAmount = deliveries.reduce(
      (sum, d) => sum + Number(d.quantity) * Number(d.purchasePrice),
      0,
    );

    const estimatedMargin = totalSalesAmount - totalPurchaseAmount;

    // Group by station
    const stationMap = new Map<
      string,
      {
        stationId: string;
        stationName: string;
        salesLiters: number;
        salesAmount: number;
      }
    >();

    for (const station of stations) {
      stationMap.set(station.id, {
        stationId: station.id,
        stationName: station.name,
        salesLiters: 0,
        salesAmount: 0,
      });
    }

    for (const sale of sales) {
      const stationId = sale.shift.nozzle.dispenser.stationId;
      const stationData = stationMap.get(stationId);
      if (stationData) {
        stationData.salesLiters += Number(sale.quantity);
        stationData.salesAmount += Number(sale.totalAmount);
      }
    }

    const byStation = Array.from(stationMap.values()).sort(
      (a, b) => b.salesAmount - a.salesAmount,
    );

    // Active alerts count
    const activeAlertsCount = await this.prisma.alert.count({
      where: { status: AlertStatus.ACTIVE },
    });

    return {
      year,
      month,
      stationsCount,
      totalSalesLiters: Math.round(totalSalesLiters * 100) / 100,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
      estimatedMargin: Math.round(estimatedMargin * 100) / 100,
      byStation,
      activeAlertsCount,
    };
  }
}
