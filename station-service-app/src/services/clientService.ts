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

  async getPurchaseHistory(clientId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ClientPurchase[]> {
    const response = await axiosInstance.get(`/clients/${clientId}/purchases`, {
      params: filters,
    });
    return response.data;
  },

  async getPaymentHistory(clientId: string): Promise<ClientPayment[]> {
    const response = await axiosInstance.get(`/clients/${clientId}/payments`);
    return response.data;
  },
};
