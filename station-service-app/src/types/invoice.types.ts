export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'OVERDUE';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  stationId: string;
  issueDate?: string;
  dueDate?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithDetails extends Invoice {
  client: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  };
  station: {
    id: string;
    name: string;
    address: string;
  };
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  fuelType?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleId?: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paidAt: string;
  createdBy: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
  description: string;
  fuelType?: string;
  quantity: number;
  unitPrice: number;
  saleId?: string;
}

export interface UpdateInvoiceDto {
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  items?: CreateInvoiceItemDto[];
}

export interface AddInvoicePaymentDto {
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface InvoiceFilters {
  clientId?: string;
  stationId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  overdue?: boolean;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  PAID: 'Payée',
  PARTIALLY_PAID: 'Partiellement payée',
  CANCELLED: 'Annulée',
  OVERDUE: 'En retard',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-orange-100 text-orange-800',
};
