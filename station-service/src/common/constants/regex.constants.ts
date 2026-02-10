/**
 * Patterns de validation pour les identifiants légaux marocains
 * et autres formats structurés.
 */

// ============ IDENTIFIANTS LÉGAUX MAROCAINS ============
export const MOROCCAN_REGEX = {
  /** ICE : Identifiant Commun de l'Entreprise — exactement 15 chiffres */
  ICE: /^\d{15}$/,
  ICE_MESSAGE: "L'ICE doit contenir exactement 15 chiffres",

  /** IF : Identifiant Fiscal — exactement 8 chiffres */
  TAX_ID: /^\d{8}$/,
  TAX_ID_MESSAGE: "L'Identifiant Fiscal doit contenir exactement 8 chiffres",

  /** RC : Registre de Commerce — 1 à 10 chiffres */
  RC: /^\d{1,10}$/,
  RC_MESSAGE: 'Le Registre du Commerce doit contenir entre 1 et 10 chiffres',

  /** Patente — alphanumérique, max 20 caractères */
  PATENTE: /^[A-Za-z0-9]{1,20}$/,
  PATENTE_MESSAGE: 'La patente doit être alphanumérique (max 20 caractères)',

  /** CNSS — 9 chiffres */
  CNSS: /^\d{9}$/,
  CNSS_MESSAGE: 'Le CNSS doit contenir exactement 9 chiffres',
} as const;

// ============ AUTRES FORMATS ============
export const FORMAT_REGEX = {
  /** Code badge pompiste — alphanumérique, 4-20 caractères */
  BADGE_CODE: /^[A-Za-z0-9]{4,20}$/,
  BADGE_CODE_MESSAGE:
    'Le code badge doit être alphanumérique (4-20 caractères)',

  /** Code PIN — exactement 6 chiffres */
  PIN_CODE: /^\d{6}$/,
  PIN_CODE_MESSAGE: 'Le code PIN doit contenir exactement 6 chiffres',

  /** Numéro de téléphone marocain */
  PHONE_MA: /^(?:\+212|0)[5-7]\d{8}$/,
  PHONE_MA_MESSAGE:
    'Le téléphone doit être au format marocain (+212XXXXXXXXX ou 0XXXXXXXXX)',
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
