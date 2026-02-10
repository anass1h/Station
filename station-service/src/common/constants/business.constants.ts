/**
 * Constantes métier centralisées.
 * Toute valeur en dur dans un service doit être extraite ici.
 * Ces constantes peuvent à terme être migrées vers une config en BDD.
 */

// ============ SHIFT ============
export const SHIFT_CONSTANTS = {
  /** Tolérance d'écart d'index entre shifts consécutifs (en litres) */
  INDEX_TOLERANCE_WARNING: 0.5,
  /** Seuil d'écart d'index bloquant */
  INDEX_TOLERANCE_BLOCK: 50,
  /** Durée maximale d'un shift avant alerte (en heures) */
  MAX_DURATION_WARNING_HOURS: 12,
  /** Durée maximale absolue d'un shift (en heures) */
  MAX_DURATION_BLOCK_HOURS: 24,
} as const;

// ============ STOCK ============
export const STOCK_CONSTANTS = {
  /** Seuil d'alerte stock bas (pourcentage de la capacité de la cuve) */
  LOW_STOCK_THRESHOLD_PERCENT: 20,
  /** Tolérance de variance de livraison (pourcentage) */
  DELIVERY_VARIANCE_TOLERANCE_PERCENT: 2,
  /** Nombre de jours pour calculer la consommation moyenne */
  AVG_CONSUMPTION_DAYS: 30,
} as const;

// ============ CAISSE ============
export const CASH_REGISTER_CONSTANTS = {
  /** Seuil de variance de caisse pour alerte (en DH) */
  VARIANCE_ALERT_THRESHOLD: 50,
  /** Seuil de variance pour blocage (en DH) */
  VARIANCE_BLOCK_THRESHOLD: 500,
} as const;

// ============ CLIENT ============
export const CLIENT_CONSTANTS = {
  /** Pourcentage du plafond crédit pour déclencher alerte */
  CREDIT_LIMIT_WARNING_PERCENT: 80,
} as const;

// ============ LICENCE ============
export const LICENCE_CONSTANTS = {
  /** Nombre de jours avant expiration pour déclencher alerte */
  EXPIRY_WARNING_DAYS_30: 30,
  EXPIRY_WARNING_DAYS_7: 7,
  EXPIRY_WARNING_DAYS_1: 1,
  /** Durée de la période de grâce après expiration (en jours) */
  GRACE_PERIOD_DAYS: 7,
} as const;

// ============ RATE LIMITING ============
export const RATE_LIMIT_CONSTANTS = {
  /** Limite globale : requêtes par fenêtre de temps */
  GLOBAL_LIMIT: 100,
  /** Fenêtre de temps globale (en millisecondes) */
  GLOBAL_TTL: 60000,
  /** Limite spécifique login : tentatives par fenêtre */
  LOGIN_LIMIT: 5,
  /** Fenêtre de temps login (en millisecondes) — 5 minutes */
  LOGIN_TTL: 300000,
  /** Nombre max de tentatives échouées avant verrouillage du compte */
  MAX_FAILED_ATTEMPTS: 10,
  /** Durée de verrouillage du compte (en minutes) */
  LOCK_DURATION_MINUTES: 30,
} as const;

// ============ TVA MAROC ============
export const TAX_CONSTANTS = {
  /** Taux TVA standard (carburant) */
  VAT_RATE_STANDARD: 20,
  /** Taux TVA réduits autorisés */
  VAT_RATES_ALLOWED: [0, 7, 10, 14, 20],
} as const;

// ============ FACTURATION ============
export const INVOICE_CONSTANTS = {
  /** Préfixe du numéro de facture */
  NUMBER_PREFIX: 'FAC',
  /** Préfixe du numéro d'avoir */
  CREDIT_NOTE_PREFIX: 'AV',
  /** Longueur de la séquence (zéro-padded) */
  SEQUENCE_LENGTH: 5,
  /** Délai de paiement par défaut (en jours) */
  DEFAULT_PAYMENT_TERMS_DAYS: 30,
} as const;

// ============ PAGINATION ============
export const PAGINATION_CONSTANTS = {
  /** Nombre d'éléments par page par défaut */
  DEFAULT_PAGE_SIZE: 20,
  /** Nombre maximum d'éléments par page */
  MAX_PAGE_SIZE: 100,
} as const;
