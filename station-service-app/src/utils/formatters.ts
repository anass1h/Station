/**
 * Formate un montant en devise marocaine
 * @param amount - Montant à formater
 * @returns "1 234,56 MAD"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
}

/**
 * Formate un nombre avec séparateurs
 * @param num - Nombre à formater
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns "1 234,56"
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formate un nombre entier
 * @param num - Nombre à formater
 * @returns "1 234"
 */
export function formatInteger(num: number): string {
  return Math.round(num).toLocaleString('fr-FR');
}

/**
 * Formate une date au format français
 * @param date - Date ou chaîne ISO
 * @returns "24/01/2025"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formate une date avec l'heure
 * @param date - Date ou chaîne ISO
 * @returns "24/01/2025 14:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une heure seulement
 * @param date - Date ou chaîne ISO
 * @returns "14:30"
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une date en temps relatif
 * @param date - Date ou chaîne ISO
 * @returns "Il y a 2 heures"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return "À l'instant";
  }
  if (diffMins < 60) {
    return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  }
  if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }
  if (diffWeeks < 4) {
    return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  }
  if (diffMonths < 12) {
    return `Il y a ${diffMonths} mois`;
  }

  return formatDate(d);
}

/**
 * Formate un volume en litres
 * @param liters - Volume en litres
 * @returns "1 234,5 L"
 */
export function formatLiters(liters: number): string {
  return `${liters.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}

/**
 * Formate un pourcentage
 * @param value - Valeur entre 0 et 100 (ou 0 et 1)
 * @param fromDecimal - Si true, multiplie par 100
 * @returns "12,5%"
 */
export function formatPercent(value: number, fromDecimal: boolean = false): string {
  const percent = fromDecimal ? value * 100 : value;
  return `${percent.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * Formate une durée en heures et minutes
 * @param minutes - Durée en minutes
 * @returns "2h 30min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins}min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Formate un numéro de téléphone marocain
 * @param phone - Numéro de téléphone
 * @returns "06 12 34 56 78"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

/**
 * Tronque un texte avec ellipsis
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué avec "..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalise la première lettre
 * @param text - Texte
 * @returns Texte avec première lettre majuscule
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formate un nom complet
 * @param firstName - Prénom
 * @param lastName - Nom
 * @returns "Prénom NOM"
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${capitalize(firstName)} ${lastName.toUpperCase()}`;
}

/**
 * Formate une plage de dates
 * @param start - Date de début
 * @param end - Date de fin
 * @returns "24/01 - 31/01/2025"
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;

  const startStr = startDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });

  const endStr = endDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}
