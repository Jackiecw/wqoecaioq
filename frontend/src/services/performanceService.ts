import apiClient from './apiClient';

export interface PerformanceTemplate {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    items: Array<{
        id?: string;
        category?: string;
        kpiName?: string;
        description?: string;
        weight?: number;
    }>;
}

export interface PerformanceUser {
    id: string;
    username: string;
    nickname: string;
}

export interface PerformanceReview {
    id: string;
    month: string;
    status: string;
    finalScore?: number;
    template: { name: string };
    manager: { nickname: string };
    employee: { nickname: string };
}

export interface ReviewDetail extends PerformanceReview {
    employeeId: string;
    managerId: string;
    directorId?: string | null;
    director?: { nickname: string } | null;
    employee: { nickname: string; username: string; department?: string };
    items: Array<{
        id: string;
        category: string;
        kpiName: string;
        description: string;
        weight: number;
        selfScore?: number;
        managerScore?: number;
        directorScore?: number;
        managerComment?: string;
        directorComment?: string;
    }>;
    summaryThisMonth?: string;
    planNextMonth?: string;
    companySuggestions?: string;
}

export const performanceService = {
    async getMyReviews() {
        const res = await apiClient.get<PerformanceReview[]>('/reviews/my');
        return res.data;
    },
    async getPendingReviews() {
        const res = await apiClient.get<PerformanceReview[]>('/reviews/pending');
        return res.data;
    },
    async getUsers() {
        const res = await apiClient.get<PerformanceUser[]>('/admin/users');
        return res.data;
    },
    async getTemplates() {
        const res = await apiClient.get<PerformanceTemplate[]>('/templates');
        return res.data;
    },
    async createTemplate(payload: Omit<PerformanceTemplate, 'id'>) {
        const res = await apiClient.post('/templates', payload);
        return res.data;
    },
    async assignReview(payload: {
        employeeId: string;
        templateId: string;
        month: string;
        managerId: string;
        directorId?: string;
    }) {
        const res = await apiClient.post('/reviews/assign', payload);
        return res.data;
    },
    async getReview(id: string) {
        const res = await apiClient.get<ReviewDetail>(`/reviews/${id}`);
        return res.data;
    },
    async updateReview(id: string, payload: any) {
        const res = await apiClient.put(`/reviews/${id}`, payload);
        return res.data;
    },
};

export default performanceService;
