import api from './api';

export interface GeneratePaymentData {
  clientId: string;
  amount: number;
  dueDate: string;
  description: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  financialRecordId?: string;
}

export const paymentsService = {
  generate: async (data: GeneratePaymentData) => {
    const response = await api.post('/payments/generate', data);
    return response.data;
  },
  
  getStatus: async (id: string) => {
    const response = await api.get(`/payments/${id}/status`);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/payments/${id}/cancel`);
    return response.data;
  }
};
