import apiClient from './apiClient';

export interface SalesData {
    id: string;
    platformOrderId: string;
    orderStatus: string;
    revenue: number;
    salesVolume: number;
    currency: string;
    platform: string;
    storeId: string;
    listingId: string;
    productId: string;
    recordDate: string;
    // ... other fields
}

export const salesService = {
    async getSalesData(params: any): Promise<any> {
        const response = await apiClient.get('/sales-data', { params });
        return response.data;
    },

    async getStats(params: any): Promise<any> {
        const response = await apiClient.get('/sales-data/stats', { params });
        return response.data;
    },

    async create(data: any): Promise<SalesData> {
        const response = await apiClient.post('/sales', data);
        return response.data;
    },

    async update(id: string, data: any): Promise<SalesData> {
        const response = await apiClient.put(`/sales-data/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/sales-data/${id}`);
    },

    // Import related
    async previewImport(formData: FormData): Promise<any> {
        const response = await apiClient.post('/sales-import/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async confirmImport(data: any): Promise<any> {
        const response = await apiClient.post('/sales-import/confirm', data);
        return response.data;
    },

    async getImportBatches(params: any): Promise<any> {
        const response = await apiClient.get('/sales-import/batches', { params });
        return response.data;
    },

    async rollbackBatch(id: string): Promise<void> {
        await apiClient.delete(`/sales-import/batch/${id}`);
    }
};
