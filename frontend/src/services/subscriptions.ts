import api from './api';

export const subscriptionsService = {
    async createCheckoutSession() {
        const response = await api.post('/subscriptions/checkout');
        return response.data;
    },
};
