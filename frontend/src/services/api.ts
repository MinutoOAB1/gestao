import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:3000`,
});

// Interceptor para adicionar token JWT se existir
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Retry interceptor — retries failed GET requests up to 3 times with exponential backoff
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config || config.method !== 'get') return Promise.reject(error);

        config.__retryCount = config.__retryCount || 0;
        if (config.__retryCount >= 3) return Promise.reject(error);

        // Only retry on network errors or 5xx server errors
        const status = error.response?.status;
        if (error.response && status < 500) return Promise.reject(error);

        config.__retryCount += 1;
        const delay = Math.pow(2, config.__retryCount) * 500; // 1s, 2s, 4s

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
    }
);

export default api;

