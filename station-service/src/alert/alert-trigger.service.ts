import { Injectable, Logger } from '@nestjs/common';
import {
  AlertPriority,
  AlertType,
  ShiftStatus,
  Tank,
  Client,
} from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { AlertService } from './alert.service.js';
import {
  SHIFT_CONSTANTS,
  STOCK_CONSTANTS,
  CASH_REGISTER_CONSTANTS,
  CLIENT_CONSTANTS,
} from '../common/index.js';

@Injectable()
export class AlertTriggerService {
  private readonly logger = new Logger(AlertTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  /**
   * Vérifie le niveau de stock d'une cuve et crée une alerte si nécessaire
   */
  async checkLowStock(tank: Tank): Promise<void> {
    const tankWithStation = await this.prisma.tank.findUnique({
      where: { id: tank.id },
      include: {
        station: true,
        fuelType: true,
      },
    });

    if (!tankWithStation) return;

    const currentLevel = Number(tank.currentLevel);
    const threshold = Number(tank.lowThreshold);

    if (currentLevel <= threshold) {
      // Vérifier si une alerte ACTIVE existe déjà
      const hasActive = await this.alertService.hasActiveAlert(
        tankWithStation.stationId,
        AlertType.LOW_STOCK,
        tank.id,
      );

      if (!hasActive) {
        const percentRemaining = Math.round(
          (currentLevel / Number(tank.capacity)) * 100,
        );
        const criticalThreshold =
          STOCK_CONSTANTS.LOW_STOCK_THRESHOLD_PERCENT / 2;
        const priority =
          percentRemaining <= criticalThreshold
            ? AlertPriority.CRITICAL
            : AlertPriority.HIGH;

        await this.alertService.create({
          stationId: tankWithStation.stationId,
          alertType: AlertType.LOW_STOCK,
          priority,
          title: `Stock bas: ${tankWithStation.fuelType.name}`,
          message: `La cuve ${tank.reference} (${tankWithStation.fuelType.name}) a atteint un niveau critique: ${currentLevel.toFixed(0)}L (${percentRemaining}%). Seuil: ${threshold.toFixed(0)}L`,
          relatedEntityId: tank.id,
          relatedEntityType: 'Tank',
        });
      }
    } else {
      // Stock remonté au-dessus du seuil, auto-résoudre les alertes
      await this.alertService.autoResolveByEntity(
        tankWithStation.stationId,
        AlertType.LOW_STOCK,
        tank.id,
      );
    }
  }

  /**
   * Vérifie si un shift est ouvert depuis trop longtemps
   */
  async checkShiftDuration(
    maxHours: number = SHIFT_CONSTANTS.MAX_DURATION_WARNING_HOURS,
  ): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxHours);

    const longOpenShifts = await this.prisma.shift.findMany({
      where: {
        status: ShiftStatus.OPEN,
        startedAt: { lt: cutoffTime },
      },
      include: {
        nozzle: {
          include: {
            dispenser: {
              include: { station: true },
            },
          },
        },
        pompiste: true,
      },
    });

    for (const shift of longOpenShifts) {
      const stationId = shift.nozzle.dispenser.stationId;
      const hasActive = await this.alertService.hasActiveAlert(
        stationId,
        AlertType.SHIFT_OPEN_TOO_LONG,
        shift.id,
      );

      if (!hasActive) {
        const hoursOpen = Math.round(
          (Date.now() - shift.startedAt.getTime()) / (1000 * 60 * 60),
        );

        await this.alertService.create({
          stationId,
          alertType: AlertType.SHIFT_OPEN_TOO_LONG,
          priority:
            hoursOpen > SHIFT_CONSTANTS.MAX_DURATION_BLOCK_HOURS
              ? AlertPriority.HIGH
              : AlertPriority.MEDIUM,
          title: `Shift ouvert depuis ${hoursOpen}h`,
          message: `Le shift de ${shift.pompiste.firstName} ${shift.pompiste.lastName} sur ${shift.nozzle.reference} est ouvert depuis ${hoursOpen} heures (démarré le ${shift.startedAt.toLocaleString('fr-FR')})`,
          relatedEntityId: shift.id,
          relatedEntityType: 'Shift',
        });
      }
    }
  }

  /**
   * Alerte en cas d'écart de caisse significatif
   */
  async checkCashVariance(
    cashRegisterId: string,
    variance: number,
    thresholdPercent: number = STOCK_CONSTANTS.DELIVERY_VARIANCE_TOLERANCE_PERCENT,
    expectedTotal: number,
  ): Promise<void> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
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
            pompiste: true,
          },
        },
      },
    });

    if (!cashRegister) return;

    const variancePercent =
      expectedTotal > 0 ? Math.abs((variance / expectedTotal) * 100) : 0;

    if (
      variancePercent >= thresholdPercent ||
      Math.abs(variance) >= CASH_REGISTER_CONSTANTS.VARIANCE_ALERT_THRESHOLD
    ) {
      const stationId = cashRegister.shift.nozzle.dispenser.stationId;

      const priority =
        variancePercent >= 5 ||
        Math.abs(variance) >= CASH_REGISTER_CONSTANTS.VARIANCE_BLOCK_THRESHOLD
          ? AlertPriority.HIGH
          : AlertPriority.MEDIUM;

      await this.alertService.create({
        stationId,
        alertType: AlertType.CASH_VARIANCE,
        priority,
        title: `Écart caisse: ${variance.toFixed(2)} MAD`,
        message: `Écart de caisse de ${variance.toFixed(2)} MAD (${variancePercent.toFixed(1)}%) détecté pour ${cashRegister.shift.pompiste.firstName} ${cashRegister.shift.pompiste.lastName}. Attendu: ${expectedTotal.toFixed(2)} MAD, Déclaré: ${Number(cashRegister.actualTotal).toFixed(2)} MAD`,
        relatedEntityId: cashRegisterId,
        relatedEntityType: 'CashRegister',
      });
    }
  }

  /**
   * Alerte en cas d'écart d'index compteur
   */
  async checkIndexVariance(
    shiftId: string,
    calculatedVolume: number,
    indexVolume: number,
    thresholdPercent = 1,
  ): Promise<void> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        nozzle: {
          include: {
            dispenser: {
              include: { station: true },
            },
          },
        },
        pompiste: true,
      },
    });

    if (!shift) return;

    const variance = indexVolume - calculatedVolume;
    const variancePercent =
      calculatedVolume > 0 ? Math.abs((variance / calculatedVolume) * 100) : 0;

    if (variancePercent >= thresholdPercent && Math.abs(variance) >= 5) {
      const stationId = shift.nozzle.dispenser.stationId;

      const priority =
        variancePercent >= 3 || Math.abs(variance) >= 50
          ? AlertPriority.HIGH
          : AlertPriority.MEDIUM;

      await this.alertService.create({
        stationId,
        alertType: AlertType.INDEX_VARIANCE,
        priority,
        title: `Écart index: ${variance.toFixed(2)}L`,
        message: `Écart d'index de ${variance.toFixed(2)}L (${variancePercent.toFixed(1)}%) sur ${shift.nozzle.reference}. Volume ventes: ${calculatedVolume.toFixed(2)}L, Volume index: ${indexVolume.toFixed(2)}L`,
        relatedEntityId: shiftId,
        relatedEntityType: 'Shift',
      });
    }
  }

  /**
   * Vérifie le crédit client proche de la limite
   */
  async checkCreditLimit(
    client: Client,
    thresholdPercent: number = CLIENT_CONSTANTS.CREDIT_LIMIT_WARNING_PERCENT,
  ): Promise<void> {
    const creditLimit = Number(client.creditLimit);
    const currentBalance = Number(client.currentBalance);

    if (creditLimit <= 0) return;

    const usagePercent = (currentBalance / creditLimit) * 100;

    if (usagePercent >= thresholdPercent) {
      const hasActive = await this.alertService.hasActiveAlert(
        client.stationId,
        AlertType.CREDIT_LIMIT,
        client.id,
      );

      if (!hasActive) {
        const priority =
          usagePercent >= 100 ? AlertPriority.HIGH : AlertPriority.MEDIUM;

        const clientName = client.companyName || client.contactName || 'Client';

        await this.alertService.create({
          stationId: client.stationId,
          alertType: AlertType.CREDIT_LIMIT,
          priority,
          title:
            usagePercent >= 100
              ? `Crédit dépassé: ${clientName}`
              : `Crédit proche limite: ${clientName}`,
          message: `${clientName} a utilisé ${usagePercent.toFixed(0)}% de son crédit. Solde: ${currentBalance.toFixed(2)} MAD / Limite: ${creditLimit.toFixed(2)} MAD`,
          relatedEntityId: client.id,
          relatedEntityType: 'Client',
        });
      }
    } else if (usagePercent < thresholdPercent - 10) {
      // Client a remboursé, auto-résoudre les alertes
      await this.alertService.autoResolveByEntity(
        client.stationId,
        AlertType.CREDIT_LIMIT,
        client.id,
      );
    }
  }

  /**
   * Vérifie les maintenances en retard ou à venir
   */
  async checkMaintenanceDue(daysAhead = 7): Promise<void> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Maintenances planifiées à venir ou en retard
    const maintenances = await this.prisma.maintenanceLog.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: futureDate },
      },
      include: {
        station: true,
        dispenser: true,
        tank: true,
        nozzle: true,
      },
    });

    for (const maintenance of maintenances) {
      if (!maintenance.scheduledAt) continue;

      const hasActive = await this.alertService.hasActiveAlert(
        maintenance.stationId,
        AlertType.MAINTENANCE_DUE,
        maintenance.id,
      );

      if (!hasActive) {
        const isOverdue = maintenance.scheduledAt < now;
        const daysUntil = Math.ceil(
          (maintenance.scheduledAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        let equipmentName = 'Équipement';
        if (maintenance.dispenser) {
          equipmentName = `Distributeur ${maintenance.dispenser.reference}`;
        } else if (maintenance.tank) {
          equipmentName = `Cuve ${maintenance.tank.reference}`;
        } else if (maintenance.nozzle) {
          equipmentName = `Pistolet ${maintenance.nozzle.reference}`;
        }

        const priority = isOverdue
          ? AlertPriority.HIGH
          : daysUntil <= 2
            ? AlertPriority.MEDIUM
            : AlertPriority.LOW;

        await this.alertService.create({
          stationId: maintenance.stationId,
          alertType: AlertType.MAINTENANCE_DUE,
          priority,
          title: isOverdue
            ? `Maintenance en retard: ${equipmentName}`
            : `Maintenance à venir: ${equipmentName}`,
          message: isOverdue
            ? `${maintenance.title} sur ${equipmentName} était planifiée le ${maintenance.scheduledAt.toLocaleDateString('fr-FR')} (${Math.abs(daysUntil)} jour(s) de retard)`
            : `${maintenance.title} sur ${equipmentName} planifiée dans ${daysUntil} jour(s) (${maintenance.scheduledAt.toLocaleDateString('fr-FR')})`,
          relatedEntityId: maintenance.id,
          relatedEntityType: 'MaintenanceLog',
        });
      }
    }
  }

  /**
   * Exécute toutes les vérifications périodiques
   */
  async runAllChecks(): Promise<{ checksRun: number; alertsCreated: number }> {
    const initialCount = await this.alertService.countActive();

    // Vérifier les shifts ouverts trop longtemps
    await this.checkShiftDuration();

    // Vérifier les stocks bas
    const tanks = await this.prisma.tank.findMany({
      where: { isActive: true },
    });
    for (const tank of tanks) {
      await this.checkLowStock(tank);
    }

    // Vérifier les maintenances
    await this.checkMaintenanceDue();

    // Vérifier les crédits clients
    const clients = await this.prisma.client.findMany({
      where: {
        isActive: true,
        creditLimit: { gt: 0 },
      },
    });
    for (const client of clients) {
      await this.checkCreditLimit(client);
    }

    const finalCount = await this.alertService.countActive();
    const alertsCreated = finalCount - initialCount;

    this.logger.log(
      `Vérifications terminées: ${alertsCreated} nouvelle(s) alerte(s)`,
    );

    return {
      checksRun: 4,
      alertsCreated: Math.max(0, alertsCreated),
    };
  }
}
