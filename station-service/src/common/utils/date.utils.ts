/**
 * Utilitaires de manipulation de dates.
 */

/** Début de journée (00:00:00) en UTC */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Fin de journée (23:59:59.999) en UTC */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Début du mois en UTC */
export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Fin du mois en UTC */
export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Différence en heures entre deux dates */
export function diffInHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/** Différence en jours entre deux dates */
export function diffInDays(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

/** Différence en minutes entre deux dates */
export function diffInMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

/** Ajouter des jours à une date */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Ajouter des mois à une date */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Formater une durée en heures et minutes */
export function formatDuration(
  startDate: Date,
  endDate: Date | null,
): { hours: number; minutes: number; formatted: string } {
  const end = endDate || new Date();
  const totalMinutes = Math.floor(diffInMinutes(startDate, end));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}min`,
  };
}

/** Vérifier si une date est dans le passé */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** Vérifier si une date est dans le futur */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/** Vérifier si une date est aujourd'hui */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}
