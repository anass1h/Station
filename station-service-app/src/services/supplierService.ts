import { axiosInstance } from './api';

export interface Supplier {
  id: string;
  stationId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station?: {
    id: string;
    name: string;
  };
}

export interface CreateSupplierDto {
  stationId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto extends Partial<Omit<CreateSupplierDto, 'stationId'>> {
  isActive?: boolean;
}

export const supplierService = {
  async getAll(stationId?: string): Promise<Supplier[]> {
    const params = stationId ? { stationId } : {};
    const response = await axiosInstance.get('/suppliers', { params });
    return response.data;
  },

  async getById(id: string): Promise<Supplier> {
    const response = await axiosInstance.get(`/suppliers/${id}`);
    return response.data;
  },

  async getByStation(_stationId: string): Promise<Supplier[]> {
    // Backend doesn't have station-specific endpoint, use getAll
    // Suppliers are global in this implementation
    const response = await axiosInstance.get('/suppliers');
    return response.data;
  },

  async create(data: CreateSupplierDto): Promise<Supplier> {
    const response = await axiosInstance.post('/suppliers', data);
    return response.data;
  },

  async update(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    const response = await axiosInstance.patch(`/suppliers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/suppliers/${id}`);
  },
};
