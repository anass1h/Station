import { Injectable } from '@nestjs/common';

@Injectable()
export class MarginCalculator {
  /**
   * Calcule la marge unitaire
   */
  calculateUnitMargin(sellingPriceHT: number, purchasePrice: number): number {
    return sellingPriceHT - purchasePrice;
  }

  /**
   * Calcule la marge totale pour une quantité donnée
   */
  calculateTotalMargin(
    quantity: number,
    sellingPriceHT: number,
    purchasePrice: number,
  ): number {
    const unitMargin = this.calculateUnitMargin(sellingPriceHT, purchasePrice);
    return quantity * unitMargin;
  }

  /**
   * Calcule le pourcentage de marge
   */
  calculateMarginPercent(sellingPriceHT: number, purchasePrice: number): number {
    if (purchasePrice === 0) {
      return 0;
    }
    const unitMargin = this.calculateUnitMargin(sellingPriceHT, purchasePrice);
    return (unitMargin / purchasePrice) * 100;
  }
}
