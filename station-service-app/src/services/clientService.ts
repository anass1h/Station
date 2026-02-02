import { axiosInstance } from './api';

export type ClientType = 'B2B' | 'B2C_REGISTERED';

export interface Client {
  id: string;
  stationId: string;
  type: ClientType;
  companyName: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  ice: string | null;
  iff: string | null;
  rc: string | null;
  creditLimit: number;
  currentBalance: number;
  paymentTermDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithStats extends Client {
  totalPurchases: number;
  totalInvoiced: number;
  totalPaid: number;
}

export interface CreateClientDto {
  type: ClientType;
  companyName?: string;
  contactName: string;
  phone?: string;
  email?: string;
  address?: string;
  ice?: string;
  iff?: string;
  rc?: string;
  creditLimit?: number;
  paymentTermDays?: number;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  isActive?: boolean;
}

export interface ClientPurchase {
  id: string;
  saleId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  fuelType: string;
  soldAt: string;
  shiftId: string;
}

export interface ClientPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
}

export const clientService = {
  async getAll(stationId: string, filters?: {
    type?: ClientType;
    isActive?: boolean;
    search?: string;
  }): Promise<Client[]> {
    const response = await axiosInstance.get('/clients', {
      params: { stationId, ...filters },
    });
    return response.data;
  },

  async getById(id: string): Promise<ClientWithStats> {
    const response = await axiosInstance.get(`/clients/${id}`);
    return response.data;
  },

  async create(stationId: string, data: CreateClientDto): Promise<Client> {
    const response = await axiosInstance.post('/clients', {
      stationId,
      ...data,
    });
    return response.data;
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await axiosInstance.patch(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/clients/${id}`);
  },

  async getPurchaseHistory(clientId: string, _filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ClientPurchase[]> {
    // Endpoint not implemented in backend - use sales by client
    try {
      const response = await axiosInstance.get(`/sales/by-client/${clientId}`);
      return response.data.map((sale: {
        id: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        fuelType?: { name: string };
        soldAt: string;
        shiftId: string;
      }) => ({
        id: sale.id,
        saleId: sale.id,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalAmount: sale.totalAmount,
        fuelType: sale.fuelType?.name || 'N/A',
        soldAt: sale.soldAt,
        shiftId: sale.shiftId,
      }));
    } catch {
      return [];
    }
  },

  async getPaymentHistory(clientId: string): Promise<ClientPayment[]> {
    // Endpoint not implemented - get from invoices
    try {
      const response = await axiosInstance.get(`/invoices/by-client/${clientId}`);
      const payments: ClientPayment[] = [];
      for (const invoice of response.data) {
        if (invoice.payments) {
          for (const payment of invoice.payments) {
            payments.push({
              id: payment.id,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod?.name || 'N/A',
              reference: payment.reference,
              paymentDate: payment.paymentDate,
            });
          }
        }
      }
      return payments;
    } catch {
      return [];
    }
  },

  async getBalance(clientId: string): Promise<{
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
  }> {
    // Get client data and calculate balance
    try {
      const client = await clientService.getById(clientId);
      return {
        creditLimit: client.creditLimit,
        currentBalance: client.currentBalance,
        availableCredit: client.creditLimit - client.currentBalance,
      };
    } catch {
      return { creditLimit: 0, currentBalance: 0, availableCredit: 0 };
    }
  },

  async getB2BClients(stationId: string): Promise<Client[]> {
    const response = await axiosInstance.get('/clients', {
      params: { stationId, clientType: 'B2B' },
    });
    return response.data;
  },

  async getClientsWithCredit(stationId: string): Promise<Client[]> {
    // Filter clients with credit locally
    const clients = await clientService.getAll(stationId);
    return clients.filter(c => c.creditLimit > 0 && c.isActive);
  },
};
