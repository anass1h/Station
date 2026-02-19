/**
 * Centralized max length constants for DTO validation.
 * Shared between backend DTOs and referenced by frontend schemas.
 */
export const VALIDATION_LIMITS = {
  // Names / labels
  NAME_SHORT: 50,
  NAME_STANDARD: 100,
  NAME_LONG: 150,

  // Addresses
  ADDRESS: 255,

  // Phone
  PHONE: 20,

  // Notes / descriptions
  NOTE_SHORT: 500,
  NOTE_LONG: 2000,

  // References
  REFERENCE: 100,
  REFERENCE_SHORT: 50,

  // Codes
  CODE: 20,
  BADGE_CODE: 20,

  // Passwords
  PASSWORD_MAX: 128,

  // Email (RFC 5321)
  EMAIL: 254,

  // Payment method label
  PAYMENT_METHOD_LABEL: 30,
} as const;
