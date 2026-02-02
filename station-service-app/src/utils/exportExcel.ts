import * as XLSX from 'xlsx';

interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: unknown, item: T) => string | number;
}

export function exportToExcel<T>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[]
): void {
  // Build header row
  const headers = columns.map((col) => col.label);

  // Build data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const itemRecord = item as Record<string, unknown>;
      const value = typeof col.key === 'string' && col.key.includes('.')
        ? col.key.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], item)
        : itemRecord[col.key as string];

      if (col.format) {
        return col.format(value, item);
      }
      return value ?? '';
    })
  );

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  const colWidths = columns.map((col) => ({
    wch: Math.max(
      col.label.length,
      ...rows.map((row) => String(row[columns.indexOf(col)] ?? '').length)
    ) + 2,
  }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // Download
  XLSX.writeFile(wb, fullFilename);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR');
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 MAD';
  return `${amount.toLocaleString('fr-FR')} MAD`;
}

export function formatNumber(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
