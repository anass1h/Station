import { axiosInstance } from './api';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type InvoiceType = 'INTERNAL' | 'B2B' | 'B2C_TICKET';

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  fuelTypeId: string | null;
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  fuelType?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  reference: string | null;
  paymentDate: string;
  notes: string | null;
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Invoice {
  id: string;
  stationId: string;
  clientId: string | null;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  periodStart: string | null;
  periodEnd: string | null;
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
  paidAmount: number;
  notes: string | null;
  issuedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    companyName: string | null;
    contactName: string;
  };
  lines?: InvoiceLine[];
  payments?: InvoicePayment[];
}

export interface CreateInvoiceLineDto {
  fuelTypeId?: string;
  description: string;
  quantity: number;
  unitPriceHT: number;
}

export interface CreateInvoiceDto {
  clientId?: string;
  type: InvoiceType;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  lines: CreateInvoiceLineDto[];
  issue?: boolean;
}

export interface AddPaymentDto {
  amount: number;
  paymentMethodId: string;
  reference?: string;
  paymentDate?: string;
  notes?: string;
}

export const invoiceService = {
  async getAll(stationId: string, filters?: {
    status?: InvoiceStatus;
    clientId?: string;
    type?: InvoiceType;
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> {
    const response = await axiosInstance.get('/invoices', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  },

  async create(stationId: string, data: CreateInvoiceDto): Promise<Invoice> {
    const response = await axiosInstance.post('/invoices', {
      stationId,
      ...data,
    });
    return response.data;
  },

  async update(id: string, data: Partial<CreateInvoiceDto>): Promise<Invoice> {
    const response = await axiosInstance.patch(`/invoices/${id}`, data);
    return response.data;
  },

  async issue(id: string): Promise<Invoice> {
    const response = await axiosInstance.post(`/invoices/${id}/issue`);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<Invoice> {
    const response = await axiosInstance.post(`/invoices/${id}/cancel`, { reason });
    return response.data;
  },

  async addPayment(id: string, data: AddPaymentDto): Promise<InvoicePayment> {
    const response = await axiosInstance.post(`/invoices/${id}/payments`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/invoices/${id}`);
  },

  async downloadPdf(id: string): Promise<Blob> {
    const response = await axiosInstance.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getNextInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}${month}-${random}`;
  },

  calculateTotals(lines: CreateInvoiceLineDto[], tvaRate: number = 0.20): {
    totalHT: number;
    tvaAmount: number;
    totalTTC: number;
  } {
    const totalHT = lines.reduce((sum, line) => sum + (line.quantity * line.unitPriceHT), 0);
    const tvaAmount = totalHT * tvaRate;
    const totalTTC = totalHT + tvaAmount;
    return {
      totalHT: Number(totalHT.toFixed(2)),
      tvaAmount: Number(tvaAmount.toFixed(2)),
      totalTTC: Number(totalTTC.toFixed(2)),
    };
  },
};
