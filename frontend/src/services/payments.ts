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
  },

  getAsaasConfig: async () => {
    const response = await api.get('/payments/asaas/config');
    return response.data;
  },

  linkAsaasAccount: async (apiKey: string, walletId?: string) => {
    const response = await api.post('/payments/asaas/link', { apiKey, walletId });
    return response.data;
  },

  createAsaasSubaccount: async (data: any) => {
    const response = await api.post('/payments/asaas/create-subaccount', data);
    return response.data;
  },

  disconnectAsaas: async () => {
    const response = await api.post('/payments/asaas/disconnect');
    return response.data;
  }
};
