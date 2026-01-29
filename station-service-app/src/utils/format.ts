// Currency formatting
export function formatCurrency(amount: number, currency = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number formatting
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Date formatting
export function formatDate(date: string | Date, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  return new Intl.DateTimeFormat('fr-FR', optionsMap[format]).format(d);
}

// Time formatting
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Liters formatting
export function formatLiters(liters: number): string {
  return `${formatNumber(liters)} L`;
}

// Percentage formatting
export function formatPercentage(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

// Phone formatting
export function formatPhone(phone: string): string {
  // Format Moroccan phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}
