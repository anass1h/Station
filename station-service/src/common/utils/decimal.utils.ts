/**
 * Utilitaires pour les calculs financiers avec précision décimale.
 * Évite les erreurs d'arrondi flottant sur les montants.
 */

import { TAX_CONSTANTS } from '../constants/index.js';

/** Arrondi financier à 2 décimales */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Arrondi volume à 3 décimales */
export function roundVolume(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Calcul HT depuis TTC */
export function calculateHT(
  amountTTC: number,
  vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
): number {
  return roundMoney(amountTTC / (1 + vatRate / 100));
}

/** Calcul TTC depuis HT */
export function calculateTTC(
  amountHT: number,
  vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
): number {
  return roundMoney(amountHT * (1 + vatRate / 100));
}

/** Calcul TVA depuis HT */
export function calculateVAT(
  amountHT: number,
  vatRate: number = TAX_CONSTANTS.VAT_RATE_STANDARD,
): number {
  return roundMoney((amountHT * vatRate) / 100);
}

/** Conversion sécurisée de Decimal Prisma en number */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}
