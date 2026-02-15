import { z } from 'zod';

/** Centralized max lengths — mirrors backend VALIDATION_LIMITS */
export const LIMITS = {
  NAME_SHORT: 50,
  NAME_STANDARD: 100,
  NAME_LONG: 150,
  ADDRESS: 255,
  PHONE: 20,
  NOTE_SHORT: 500,
  NOTE_LONG: 2000,
  REFERENCE: 100,
  REFERENCE_SHORT: 50,
  CODE: 20,
  BADGE_CODE: 20,
  PASSWORD_MAX: 128,
  EMAIL: 254,
} as const;

const NO_HTML_REGEX = /^[^<>]*$/;
const NO_HTML_MSG = 'Les balises HTML ne sont pas autorisées';

/** Required sanitized string: trimmed, no HTML, with max length */
export const zText = (max: number, requiredMsg?: string) =>
  z
    .string()
    .min(1, requiredMsg ?? 'Ce champ est requis')
    .max(max)
    .regex(NO_HTML_REGEX, NO_HTML_MSG)
    .transform((v) => v.trim());

/** Optional sanitized string: trimmed, no HTML, with max length */
export const zOptionalText = (max: number) =>
  z
    .string()
    .max(max)
    .regex(NO_HTML_REGEX, NO_HTML_MSG)
    .transform((v) => v.trim())
    .optional()
    .or(z.literal(''));

/** Password field — max length only, no HTML check, no trim */
export const zPassword = (min = 8) =>
  z.string().min(min).max(LIMITS.PASSWORD_MAX);
