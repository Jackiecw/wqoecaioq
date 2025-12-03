import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/auth';

// 统一 HTTP 入口：优先环境变量，否则固定走 /api，由 Vite 代理到后端
const baseURL = (import.meta.env.VITE_API_BASE_URL || '').trim() || '/api';

const apiClient: AxiosInstance = axios.create({
    baseURL,
    timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        const authStore = useAuthStore();
        if (error.response?.status === 401) {
            authStore.logout();
        }
        return Promise.reject(error);
    },
);

export default apiClient;
