import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { TAX_CONSTANTS } from '../constants/business.constants.js';

export interface PriceInfo {
  id: string;
  sellingPrice: number;
  sellingPriceHT: number;
  purchasePrice: number;
}

@Injectable()
export class PriceCalculator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le prix actif pour un type de carburant dans une station
   */
  async getCurrentPrice(
    stationId: string,
    fuelTypeId: string,
  ): Promise<PriceInfo | null> {
    const price = await this.prisma.price.findFirst({
      where: {
        stationId,
        fuelTypeId,
        effectiveTo: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!price) {
      return null;
    }

    return {
      id: price.id,
      sellingPrice: Number(price.sellingPrice),
      sellingPriceHT: Number(price.sellingPriceHT),
      purchasePrice: Number(price.purchasePrice),
    };
  }

  /**
   * Calcule le montant HT à partir du TTC
   */
  calculateHT(
    amountTTC: number,
    vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
  ): number {
    return amountTTC / (1 + vatRate / 100);
  }

  /**
   * Calcule le montant TTC à partir du HT
   */
  calculateTTC(
    amountHT: number,
    vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
  ): number {
    return amountHT * (1 + vatRate / 100);
  }

  /**
   * Calcule le montant de TVA à partir du HT
   */
  calculateVAT(
    amountHT: number,
    vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
  ): number {
    return amountHT * (vatRate / 100);
  }
}
