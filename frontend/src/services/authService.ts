import apiClient from './apiClient';

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        role: string;
        supervisedCountries?: string[];
    };
}

export const authService = {
    async login(credentials: any): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    },

    async register(userData: any): Promise<any> {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },

    logout() {
        // Client-side logout handled by store, but if we had a backend logout endpoint:
        // return apiClient.post('/auth/logout');
    }
};
