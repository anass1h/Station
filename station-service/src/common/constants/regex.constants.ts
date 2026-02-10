/**
 * Patterns de validation pour les identifiants légaux marocains
 * et autres formats structurés.
 */

// ============ IDENTIFIANTS LÉGAUX MAROCAINS ============
export const MOROCCAN_REGEX = {
  /** ICE : Identifiant Commun de l'Entreprise — exactement 15 chiffres */
  ICE: /^\d{15}$/,
  /** IF : Identifiant Fiscal — exactement 8 chiffres */
  TAX_ID: /^\d{8}$/,
  /** RC : Registre de Commerce — 1 à 10 chiffres */
  RC: /^\d{1,10}$/,
  /** Patente — alphanumérique, max 20 caractères */
  PATENTE: /^[A-Za-z0-9]{1,20}$/,
  /** CNSS — 9 chiffres */
  CNSS: /^\d{9}$/,
} as const;

// ============ AUTRES FORMATS ============
export const FORMAT_REGEX = {
  /** Code badge pompiste — alphanumérique, 4-20 caractères */
  BADGE_CODE: /^[A-Za-z0-9]{4,20}$/,
  /** Code PIN — exactement 6 chiffres */
  PIN_CODE: /^\d{6}$/,
  /** Numéro de téléphone marocain */
  PHONE_MA: /^(?:\+212|0)[5-7]\d{8}$/,
} as const;

// ============ PIN BLACKLIST ============
export const PIN_BLACKLIST = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
  '012345',
  '543210',
];
