import { axiosInstance } from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  requiresDetails: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePaymentMethodDto {
  isActive?: boolean;
}

export const paymentMethodService = {
  async getAll(): Promise<PaymentMethod[]> {
    const response = await axiosInstance.get('/payment-methods');
    return response.data;
  },

  async getActive(): Promise<PaymentMethod[]> {
    const response = await axiosInstance.get('/payment-methods/active');
    return response.data;
  },

  async getById(id: string): Promise<PaymentMethod> {
    const response = await axiosInstance.get(`/payment-methods/${id}`);
    return response.data;
  },

  async toggleActive(id: string, isActive: boolean): Promise<PaymentMethod> {
    const response = await axiosInstance.patch(`/payment-methods/${id}`, { isActive });
    return response.data;
  },
};
